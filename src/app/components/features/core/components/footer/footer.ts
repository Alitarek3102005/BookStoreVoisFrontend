import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './footer.html',
  styleUrls: ['./footer.css']
})
export class Footer {
  email: string = '';
  currentYear: number = new Date().getFullYear();

  subscribe() {
    if (this.email.trim()) {
      console.log('Subscribed with:', this.email);
      this.email = '';
      alert('Thank you for subscribing to Virtual Bookstore updates!');
    }
  }
}