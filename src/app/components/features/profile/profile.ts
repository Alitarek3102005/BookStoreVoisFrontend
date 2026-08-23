import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import Keycloak from 'keycloak-js';
import { User } from '../../../models/user'; 
import { UserService } from '../../../services/user-service';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './profile.html',
  styleUrls: ['./profile.css']
})
export class Profile implements OnInit {
  private keycloak = inject(Keycloak);
  private userService = inject(UserService);

  activeTab: 'general' | 'security' = 'general';
  
  profile: User = {
    username: '',
    email: ''
  };
 
  userRole = 'CUSTOMER';
  isLoading = false;
  successMessage = '';
  errorMessage = '';

  currentPassword = '';
  newPassword = '';
  confirmPassword = '';

  ngOnInit(): void {
    this.loadUserProfile();
  }

  loadUserProfile(): void {
    if (this.keycloak && this.keycloak.tokenParsed) {
      const parsed: any = this.keycloak.tokenParsed;
      this.profile.userId = parsed.sub;
      this.profile.username = parsed.preferred_username || parsed.name || 'User';
      this.profile.email = parsed.email || '';
      
      const roles = parsed.realm_access?.roles || [];
      this.userRole = roles.includes('ADMIN') ? 'ADMIN' : 'CUSTOMER';
    }
  }

  setTab(tab: 'general' | 'security'): void {
    this.activeTab = tab;
    this.successMessage = '';
    this.errorMessage = '';
  }

  saveProfile(): void {
    if (!this.profile.username || !this.profile.email || !this.profile.userId) {
      this.errorMessage = 'Username and email are required.';
      this.successMessage = '';
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';
    this.successMessage = '';

    const patchPayload: Partial<User> = {
      username: this.profile.username,
      email: this.profile.email
    };

    this.userService.patchUser(this.profile.userId, patchPayload).subscribe({
      next: () => {
        this.isLoading = false;
        this.successMessage = 'Profile updated successfully.';
      },
      error: (err) => {
        console.error('Profile update failed:', err);
        this.isLoading = false;
        this.errorMessage = 'Failed to update profile. The email or username might be taken or invalid.';
      }
    });
  }

  updatePassword(): void {
    if (!this.currentPassword || !this.newPassword || !this.confirmPassword || !this.profile.userId) {
      this.errorMessage = 'Please fill out all password fields.';
      return;
    }

    if (this.newPassword !== this.confirmPassword) {
      this.errorMessage = 'New passwords do not match.';
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';
    this.successMessage = '';

    const updatePayload: User = {
      username: this.profile.username,
      email: this.profile.email,
      password: this.newPassword
    };

    this.userService.updateUser(this.profile.userId, updatePayload).subscribe({
      next: () => {
        this.isLoading = false;
        this.currentPassword = '';
        this.newPassword = '';
        this.confirmPassword = '';
        this.successMessage = 'Password changed successfully.';
      },
      error: (err) => {
        console.error('Password update failed:', err);
        this.isLoading = false;
        this.errorMessage = 'Failed to update password. Please try again.';
      }
    });
  }
}