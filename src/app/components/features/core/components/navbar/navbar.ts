import { Component, HostListener, inject, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import Keycloak from 'keycloak-js';
import { CartService } from '../../../../../services/cart-service';
import { CartResponse } from '../../../../../models/cart-response';

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
  currentUserId = '';

  ngOnInit(): void {
    // Subscribe to the real backend CartResponse stream to calculate badge count
    this.cartService.cart$.subscribe((cart: CartResponse | null) => {
      if (cart && cart.items) {
        this.cartItemCount = cart.items.reduce((sum, item) => sum + item.quantity, 0);
      } else {
        this.cartItemCount = 0;
      }
      this.cdr.detectChanges();
    });

    this.updateAuthState();

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
      this.isAuthenticated = !!this.keycloak.authenticated;
      
      if (this.isAuthenticated && this.keycloak.tokenParsed) {
        const parsed: any = this.keycloak.tokenParsed;
        this.username = parsed.preferred_username || parsed.email || 'User';
        this.userInitials = this.username.substring(0, 2).toUpperCase();
        this.currentUserId = parsed.sub; // Keycloak user UUID
        
        const roles = parsed.realm_access?.roles || [];
        this.userRole = roles.includes('ADMIN') ? 'ADMIN' : 'CUSTOMER';
        
        // Fetch real backend cart items for this user
        if (this.currentUserId) {
          this.cartService.loadCart(this.currentUserId).subscribe({
            error: (err) => console.error('Failed to sync navbar cart count', err)
          });
        }
        
      } else {
        this.isAuthenticated = false;
        this.username = '';
        this.userInitials = '';
        this.userRole = '';
        this.currentUserId = '';
        this.cartItemCount = 0;
      }
      
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
      localStorage.removeItem('kc_token');
      localStorage.removeItem('kc_refresh_token');
      
      this.isAuthenticated = false;
      this.username = '';
      this.userInitials = '';
      this.userRole = '';
      this.cartItemCount = 0;
      this.cdr.detectChanges();

      await this.keycloak.logout({
        redirectUri: window.location.origin + '/'
      });
      
    } catch (err) {
      console.error('Logout failed:', err);
    }
  }
}