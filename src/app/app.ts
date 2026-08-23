import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Navbar } from './components/features/core/components/navbar/navbar';
import { Footer } from './components/features/core/components/footer/footer';
import { Home } from './components/features/home/home';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet,Navbar,Footer],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  protected readonly title = signal('BookStore');
}
