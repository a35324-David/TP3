import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PortfolioService } from '../../services/portfolio.service';

@Component({
  selector: 'app-summary-cards',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="summary-grid animate-fade-in">
      <!-- 1. Total Invested (Blue Pillar) -->
      <div class="summary-card card-blue">
        <div class="card-glow"></div>
        <div class="card-inner">
          <div class="card-header">
            <span class="card-title">Valor de Aquisição</span>
            <div class="card-icon">💰</div>
          </div>
          <h2 class="card-value value-blue">
            {{ portfolioService.totalInvested() | currency:'USD':'symbol':'1.2-2' }}
          </h2>
          <div class="card-footer">
            <span>Capital total investido</span>
          </div>
        </div>
      </div>

      <!-- 2. Current Portfolio Value (Green Pillar) -->
      <div class="summary-card card-green">
        <div class="card-glow"></div>
        <div class="card-inner">
          <div class="card-header">
            <span class="card-title">Valor Atual</span>
            <div class="card-icon">📈</div>
          </div>
          <h2 class="card-value value-green">
            {{ portfolioService.totalCurrentValue() | currency:'USD':'symbol':'1.2-2' }}
          </h2>
          <div class="card-footer">
            <span>Avaliação da carteira ao dia</span>
          </div>
        </div>
      </div>

      <!-- 3. Net Gain/Loss (Dynamic color Pillar) -->
      <div class="summary-card" [ngClass]="getGainLossClass()">
        <div class="card-glow"></div>
        <div class="card-inner">
          <div class="card-header">
            <span class="card-title">Lucro / Prejuízo Total</span>
            <div class="card-icon">{{ portfolioService.totalGainLoss() >= 0 ? '🚀' : '⚠️' }}</div>
          </div>
          <h2 class="card-value" [ngClass]="getGainLossTextClass()">
            {{ portfolioService.totalGainLoss() | currency:'USD':'symbol':'1.2-2' }}
          </h2>
          <div class="card-footer dynamic-gain-indicator">
            <span [ngClass]="getGainLossTextClass()">
              {{ portfolioService.totalGainLoss() >= 0 ? '▲' : '▼' }} 
              {{ portfolioService.totalGainLossPercent() | number:'1.2-2' }}%
            </span>
            <span class="footer-note">Retorno absoluto</span>
          </div>
        </div>
      </div>

      <!-- 4. Total Asset Holdings -->
      <div class="summary-card card-neutral">
        <div class="card-glow"></div>
        <div class="card-inner">
          <div class="card-header">
            <span class="card-title">Ativos & Posições</span>
            <div class="card-icon">💼</div>
          </div>
          <h2 class="card-value text-white">
            {{ portfolioService.portfolioItems().length }}
          </h2>
          <div class="card-footer">
            <span>{{ getHoldingSummary() }}</span>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .summary-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 1.25rem;
      margin-bottom: 2rem;
    }

    .summary-card {
      background: var(--bg-card);
      backdrop-filter: var(--glass-blur);
      -webkit-backdrop-filter: var(--glass-blur);
      border: 1px solid var(--border-color);
      border-radius: var(--radius-md);
      box-shadow: var(--shadow-main);
      position: relative;
      overflow: hidden;
      transition: var(--transition-smooth);
    }

    .summary-card:hover {
      background: var(--bg-card-hover);
      transform: translateY(-3px);
      box-shadow: 0 12px 36px 0 rgba(0, 0, 0, 0.45);
    }

    .card-glow {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 6px;
      background: var(--border-color);
      transition: var(--transition-smooth);
    }

    .card-inner {
      padding: 1.5rem;
      position: relative;
      z-index: 2;
    }

    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 0.75rem;
    }

    .card-title {
      font-family: var(--font-display);
      font-weight: 600;
      font-size: 0.8rem;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: var(--text-secondary);
    }

    .card-icon {
      font-size: 1.2rem;
      width: 32px;
      height: 32px;
      border-radius: 8px;
      background: rgba(255, 255, 255, 0.04);
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .card-value {
      font-size: 1.85rem;
      font-family: var(--font-display);
      font-weight: 700;
      margin-bottom: 0.5rem;
      letter-spacing: -0.01em;
    }

    .card-footer {
      font-size: 0.75rem;
      color: var(--text-muted);
      font-weight: 500;
    }

    /* Column Blue and Green values mapped directly */
    .card-blue .card-glow {
      background: linear-gradient(90deg, #3b82f6, #60a5fa);
    }
    .value-blue {
      color: #3b82f6 !important;
    }

    .card-green .card-glow {
      background: linear-gradient(90deg, #10b981, #34d399);
    }
    .value-green {
      color: #10b981 !important;
    }

    /* Net gains and losses glows and texts */
    .card-gain .card-glow {
      background: linear-gradient(90deg, #10b981, #059669);
    }
    .card-loss .card-glow {
      background: linear-gradient(90deg, #ef4444, #dc2626);
    }
    .card-flat .card-glow {
      background: linear-gradient(90deg, #94a3b8, #64748b);
    }

    .text-white {
      color: var(--text-primary);
    }

    .dynamic-gain-indicator {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .footer-note {
      color: var(--text-muted) !important;
      font-weight: 500;
    }

    @media (max-width: 1024px) {
      .summary-grid {
        grid-template-columns: repeat(2, 1fr);
      }
    }

    @media (max-width: 600px) {
      .summary-grid {
        grid-template-columns: 1fr;
      }
    }
  `]
})
export class SummaryCardsComponent {
  portfolioService = inject(PortfolioService);

  getGainLossClass(): string {
    const gain = this.portfolioService.totalGainLoss();
    if (gain > 0) return 'card-gain';
    if (gain < 0) return 'card-loss';
    return 'card-flat';
  }

  getGainLossTextClass(): string {
    const gain = this.portfolioService.totalGainLoss();
    if (gain > 0) return 'trend-up';
    if (gain < 0) return 'trend-down';
    return 'trend-flat';
  }

  getHoldingSummary(): string {
    const count = this.portfolioService.portfolioItems().length;
    if (count === 0) return 'Nenhum ativo em carteira';
    const tickers = [...new Set(this.portfolioService.portfolioItems().map(item => item.ticker))];
    return `${tickers.length} Símbolos únicos`;
  }
}
