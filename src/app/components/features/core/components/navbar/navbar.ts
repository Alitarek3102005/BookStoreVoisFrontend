import { Component, HostListener, inject, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import Keycloak from 'keycloak-js';
import { CartService } from '../../../../../services/cart-service'; // Adjust path if needed

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './navbar.html',
  styleUrls: ['./navbar.css']
})
export class Navbar implements OnInit {
  private keycloak = inject(Keycloak);
  private cartService = inject(CartService);
  private cdr = inject(ChangeDetectorRef);

  isScrolled = false;
  isMobileMenuOpen = false;
  cartItemCount = 0;
  searchQuery = '';

  isAuthenticated = false;
  username = '';
  userInitials = '';
  userRole = '';

  ngOnInit(): void {
    // 1. Subscribe to cart items
    this.cartService.cart$.subscribe(items => {
      this.cartItemCount = items.reduce((sum, item) => sum + item.quantity, 0);
    });

    // 2. Initial state evaluation based ONLY on real Keycloak state
    this.updateAuthState();

// 3. Register Keycloak event hooks. 
    if (this.keycloak) {
      this.keycloak.onAuthSuccess = () => {
        if (this.keycloak.token) localStorage.setItem('kc_token', this.keycloak.token);
        if (this.keycloak.refreshToken) localStorage.setItem('kc_refresh_token', this.keycloak.refreshToken);
        this.updateAuthState();
      };
      
      this.keycloak.onAuthRefreshSuccess = () => {
        if (this.keycloak.token) localStorage.setItem('kc_token', this.keycloak.token);
        if (this.keycloak.refreshToken) localStorage.setItem('kc_refresh_token', this.keycloak.refreshToken);
        this.updateAuthState();
      };
      
      this.keycloak.onAuthLogout = () => {
        localStorage.removeItem('kc_token');
        localStorage.removeItem('kc_refresh_token');
        this.updateAuthState();
      };
      
      this.keycloak.onTokenExpired = () => {
        this.keycloak.updateToken(30).catch(() => this.logout());
      };
    }
  }

  updateAuthState(): void {
    if (this.keycloak) {
      // STRICT CHECK: Only true if Keycloak itself confirms authentication
      this.isAuthenticated = !!this.keycloak.authenticated;
      
      if (this.isAuthenticated && this.keycloak.tokenParsed) {
        const parsed: any = this.keycloak.tokenParsed;
        this.username = parsed.preferred_username || parsed.email || 'User';
        this.userInitials = this.username.substring(0, 2).toUpperCase();
        
        // Extract Role for the Navbar badge
        const roles = parsed.realm_access?.roles || [];
        this.userRole = roles.includes('ADMIN') ? 'ADMIN' : 'CUSTOMER';
        
      } else {
        // Completely wipe state if not authenticated
        this.isAuthenticated = false;
        this.username = '';
        this.userInitials = '';
        this.userRole = '';
      }
      
      // Force Angular to re-render the navbar HTML immediately
      this.cdr.detectChanges();
    }
  }

  @HostListener('window:scroll', [])
  onWindowScroll() {
    this.isScrolled = window.scrollY > 20;
  }

  toggleMobileMenu() {
    this.isMobileMenuOpen = !this.isMobileMenuOpen;
  }

  onSearch() {
    if (this.searchQuery.trim()) {
      console.log('Searching for:', this.searchQuery);
    }
  }

  async logout() {
    try {
      // 1. Destroy the local storage tokens FIRST so they don't resurrect your session
      localStorage.removeItem('kc_token');
      localStorage.removeItem('kc_refresh_token');
      
      // 2. Clear component state visually
      this.isAuthenticated = false;
      this.username = '';
      this.userInitials = '';
      this.userRole = '';
      this.cdr.detectChanges();

      // 3. Redirect to Keycloak to kill the real session
      await this.keycloak.logout({
        redirectUri: window.location.origin + '/'
      });
      
    } catch (err) {
      console.error('Logout failed:', err);
    }
  }
}