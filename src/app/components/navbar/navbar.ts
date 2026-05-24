import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PortfolioService } from '../../services/portfolio.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule],
  template: `
    <header class="navbar-header">
      <div class="nav-brand">
        <div class="logo-icon">📊</div>
        <div class="brand-text">
          <h1>Carteira dos Ricos</h1>
        </div>
      </div>

      <div class="nav-controls">
        <!-- Pricing Mode Switcher (Grading Demo vs Live) -->
        <div class="mode-toggle-group">
          <button 
            [class.active]="portfolioService.priceMode() === 'demo'"
            (click)="setMode('demo')"
            class="mode-btn btn-demo"
            title="Pre-loads MSFT at 330.00 & TSLA at 224.00 for 05/05/2026 as requested in the guide.">
            🎓 Demo 05/05/2026
          </button>
          <button 
            [class.active]="portfolioService.priceMode() === 'live'"
            (click)="setMode('live')"
            class="mode-btn btn-live"
            title="Fetches live stock quotes from Yahoo Finance REST API proxy.">
            ⚡ Live Market
          </button>
        </div>

        <!-- Connection Status -->
        <div class="status-indicator" [class.connected]="portfolioService.isBackendConnected()">
          <span class="status-dot"></span>
          <span class="status-label">
            {{ portfolioService.isBackendConnected() ? 'REST API ON' : 'REST API OFF' }}
          </span>
        </div>

        <!-- Theme Toggle -->
        <button class="theme-toggle-btn" (click)="toggleTheme()" aria-label="Toggle Theme">
          {{ isDarkMode ? '☀️' : '🌙' }}
        </button>

        <!-- User Profile Avatar -->
        <div class="profile-chip">
          <div class="avatar">DS</div>
          <div class="avatar-info">
            <span class="profile-name">David Barrote</span>
            <span class="profile-role">Student</span>
          </div>
        </div>
      </div>
    </header>
  `,
  styles: [`
    .navbar-header {
      background: var(--bg-card);
      backdrop-filter: var(--glass-blur);
      border-bottom: 1px solid var(--border-color);
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 0.75rem 2rem;
      position: sticky;
      top: 0;
      z-index: 100;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
    }
    
    .nav-brand {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }
    
    .logo-icon {
      font-size: 1.8rem;
      background: linear-gradient(135deg, var(--accent-primary), var(--accent-secondary));
      padding: 0.4rem;
      border-radius: var(--radius-sm);
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 4px 10px rgba(37, 99, 235, 0.3);
    }

    .brand-text h1 {
      font-size: 1.25rem;
      line-height: 1.1;
      font-weight: 700;
      background: linear-gradient(135deg, var(--text-primary), var(--text-secondary));
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }

    .brand-text span {
      font-size: 0.7rem;
      color: var(--accent-secondary);
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    .nav-controls {
      display: flex;
      align-items: center;
      gap: 1.25rem;
    }

    /* Mode Toggler style */
    .mode-toggle-group {
      display: flex;
      background: rgba(0, 0, 0, 0.2);
      border: 1px solid var(--border-color);
      padding: 0.2rem;
      border-radius: var(--radius-sm);
    }

    .mode-btn {
      font-family: var(--font-display);
      font-weight: 600;
      font-size: 0.75rem;
      padding: 0.4rem 0.8rem;
      border: none;
      background: transparent;
      color: var(--text-muted);
      border-radius: 4px;
      cursor: pointer;
      transition: var(--transition-smooth);
    }

    .mode-btn.active {
      color: #ffffff;
    }

    .btn-demo.active {
      background: var(--accent-primary);
      box-shadow: 0 2px 8px var(--accent-primary-glow);
    }

    .btn-live.active {
      background: var(--color-green);
      box-shadow: 0 2px 8px var(--color-green-glow);
    }

    /* Connection status badge */
    .status-indicator {
      display: flex;
      align-items: center;
      gap: 0.4rem;
      background: rgba(239, 68, 68, 0.1);
      border: 1px solid rgba(239, 68, 68, 0.2);
      color: var(--color-red);
      padding: 0.3rem 0.6rem;
      border-radius: 9999px;
      font-size: 0.7rem;
      font-weight: 700;
      font-family: var(--font-display);
      transition: var(--transition-smooth);
    }

    .status-indicator.connected {
      background: var(--color-green-glow);
      border: 1px solid rgba(16, 185, 129, 0.2);
      color: var(--color-green);
    }

    .status-dot {
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background: var(--color-red);
      box-shadow: 0 0 8px var(--color-red);
      display: inline-block;
    }

    .status-indicator.connected .status-dot {
      background: var(--color-green);
      box-shadow: 0 0 8px var(--color-green);
    }

    /* Theme Toggle Button */
    .theme-toggle-btn {
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid var(--border-color);
      width: 32px;
      height: 32px;
      border-radius: 50%;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 0.95rem;
      transition: var(--transition-smooth);
    }
    .theme-toggle-btn:hover {
      background: rgba(255, 255, 255, 0.1);
      transform: scale(1.05);
    }

    /* Profile Chip */
    .profile-chip {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      border-left: 1px solid var(--border-color);
      padding-left: 1.25rem;
    }

    .avatar {
      width: 32px;
      height: 32px;
      border-radius: 50%;
      background: linear-gradient(135deg, var(--accent-secondary), var(--accent-primary));
      color: #ffffff;
      font-family: var(--font-display);
      font-weight: 700;
      font-size: 0.85rem;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2);
    }

    .avatar-info {
      display: flex;
      flex-direction: column;
      line-height: 1.2;
    }

    .profile-name {
      font-size: 0.8rem;
      font-weight: 600;
      color: var(--text-primary);
    }

    .profile-role {
      font-size: 0.65rem;
      color: var(--text-muted);
    }

    @media (max-width: 768px) {
      .avatar-info, .profile-chip {
        display: none;
      }
      .navbar-header {
        padding: 0.75rem 1rem;
      }
    }
  `]
})
export class NavbarComponent {
  portfolioService = inject(PortfolioService);
  isDarkMode = true;

  toggleTheme(): void {
    this.isDarkMode = !this.isDarkMode;
    const theme = this.isDarkMode ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', theme);
  }

  setMode(mode: 'demo' | 'live'): void {
    this.portfolioService.setPriceMode(mode);
  }
}
