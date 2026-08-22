import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { HttpClient, HttpParams } from '@angular/common/http';
import Keycloak from 'keycloak-js';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './login.html',
  styleUrls: ['./login.css']
})
export class Login {
  private router = inject(Router);
  private http = inject(HttpClient);
  private keycloak = inject(Keycloak);

  email = '';
  password = '';
  rememberMe = false;
  showPassword = false;
  
  isLoading = false;
  errorMessage = '';

  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  onSubmit(): void {
    if (!this.email || !this.password) {
      this.errorMessage = 'Please enter both your email and password.';
      return;
    }

    this.errorMessage = '';
    this.isLoading = true;

    const tokenUrl = 'http://localhost:8081/realms/bookstore-realm/protocol/openid-connect/token';

    const body = new HttpParams()
      .set('client_id', 'bookstore-frontend')
      .set('grant_type', 'password')
      .set('username', this.email)
      .set('password', this.password);

    this.http.post<any>(tokenUrl, body.toString(), {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
    }).subscribe({
      next: (res) => {
        this.isLoading = false;
        
        // 1. Assign tokens to the Keycloak instance
        this.keycloak.authenticated = true;
        this.keycloak.token = res.access_token;
        this.keycloak.refreshToken = res.refresh_token;
        
        // 2. Parse the token so tokenParsed is populated for the navbar
        // We decode the JWT payload manually or use Keycloak's internal parser if available
        const tokenParts = res.access_token.split('.');
        if (tokenParts.length === 2 || tokenParts.length === 3) {
          this.keycloak.tokenParsed = JSON.parse(atob(tokenParts[1]));
        }

        // 3. Force trigger Keycloak's auth success event so listeners pick it up
        if (this.keycloak.onAuthSuccess) {
          this.keycloak.onAuthSuccess();
        }

        console.log('Login successful, token saved in memory.');
        this.router.navigate(['/']);
      },
      error: (err) => {
        this.isLoading = false;
        console.error('Authentication failed:', err);
        this.errorMessage = 'Invalid email or password. Please try again.';
      }
    });
  }
}