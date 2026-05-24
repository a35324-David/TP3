import { Component, signal } from '@angular/core';
import { NavbarComponent } from './components/navbar/navbar';
import { DashboardComponent } from './components/dashboard/dashboard';

@Component({
  selector: 'app-root',
  imports: [NavbarComponent, DashboardComponent],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {
  protected readonly title = signal('stock-portfolio');
}
