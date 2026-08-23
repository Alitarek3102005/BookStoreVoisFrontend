import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { UserService } from '../../../../services/user-service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './register.html',
  styleUrls: ['./register.css']
})
export class Register {
  private userService = inject(UserService);
  private router = inject(Router);

  username = '';
  email = '';
  address = ''; 
  password = '';
  confirmPassword = '';
  
  // UI States
  showPassword = false;
  isLoading = false;
  errorMessage = '';

  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  onSubmit(): void {
    if (!this.username || !this.email || !this.address || !this.password || !this.confirmPassword) {
      this.errorMessage = 'Please fill out all required fields.';
      return;
    }

    if (this.password !== this.confirmPassword) {
      this.errorMessage = 'Passwords do not match.';
      return;
    }

    if (this.password.length < 6) {
      this.errorMessage = 'Password must be at least 6 characters long.';
      return;
    }

    this.errorMessage = '';
    this.isLoading = true;

    const newUser = {
      username: this.username,
      email: this.email,
      address: this.address,
      password: this.password
    };

    this.userService.registerUser(newUser).subscribe({
      next: (response) => {
        this.isLoading = false;
        console.log('User registered successfully in PostgreSQL:', response);
        this.router.navigate(['/login']);
      },
      error: (err) => {
        this.isLoading = false;
        console.error('Registration failed:', err);
        this.errorMessage = err.error?.message || 'Registration failed. Username or email might already be taken.';
      }
    });
  }
}