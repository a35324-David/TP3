import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PortfolioService } from '../../services/portfolio.service';
import { SummaryCardsComponent } from '../summary-cards/summary-cards';
import { PortfolioTableComponent } from '../portfolio-table/portfolio-table';
import { PortfolioChartsComponent } from '../portfolio-charts/portfolio-charts';
import { ImportExportComponent } from '../import-export/import-export';
import { TransactionModalComponent } from '../transaction-modal/transaction-modal';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    SummaryCardsComponent,
    PortfolioTableComponent,
    PortfolioChartsComponent,
    ImportExportComponent,
    TransactionModalComponent
  ],
  template: `
    <div class="dashboard-wrapper">
      
      <!-- Upper Section: Greetings & Main CTA -->
      <div class="dashboard-banner animate-fade-in">
        <div class="greeting-box">
          <h2>Bem-vindo à sua Carteira</h2>
          <p>Sincronizada em tempo real com a API REST da sua instituição.</p>
        </div>
        
        <div class="banner-actions">
          <button class="btn btn-secondary" (click)="refreshPrices()" title="Recarrega as cotações do dia">
            🔄 Atualizar Preços
          </button>
          <button class="btn btn-primary" (click)="isModalOpen.set(true)">
            ➕ Comprar Ação
          </button>
        </div>
      </div>

      <!-- 1. KPI METRIC CARDS -->
      <app-summary-cards></app-summary-cards>

      <!-- 2. DATA VISUALIZATION CHARTS -->
      <app-portfolio-charts></app-portfolio-charts>

      <!-- 3. DETAILED LEDGER TABLE -->
      <app-portfolio-table></app-portfolio-table>

      <!-- 4. DATABASE INTEGRATION & BACKUP PANELS -->
      <app-import-export></app-import-export>

      <!-- 5. SLIDE-OUT ADD TRANSACTION DRAWER OVERLAY -->
      <app-transaction-modal 
        *ngIf="isModalOpen()" 
        (close)="isModalOpen.set(false)">
      </app-transaction-modal>

    </div>
  `,
  styles: [`
    .dashboard-wrapper {
      display: flex;
      flex-direction: column;
    }

    .dashboard-banner {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 2rem;
      flex-wrap: wrap;
      gap: 1rem;
    }

    .greeting-box h2 {
      font-size: 1.6rem;
      font-weight: 700;
      color: var(--text-primary);
      letter-spacing: -0.02em;
    }

    .greeting-box p {
      font-size: 0.85rem;
      color: var(--text-secondary);
      margin-top: 0.25rem;
    }

    .banner-actions {
      display: flex;
      gap: 0.75rem;
    }

    @media (max-width: 600px) {
      .dashboard-banner {
        flex-direction: column;
        align-items: flex-start;
      }
      .banner-actions {
        width: 100%;
      }
      .banner-actions button {
        flex: 1;
      }
    }
  `]
})
export class DashboardComponent implements OnInit {
  portfolioService = inject(PortfolioService);
  isModalOpen = signal<boolean>(false);

  ngOnInit(): void {
    // Initial fetch of portfolio records upon landing
    this.portfolioService.loadPortfolio();
  }

  refreshPrices(): void {
    const tickers = this.portfolioService.portfolioItems().map(item => item.ticker);
    const uniqueTickers = [...new Set(tickers)];
    if (uniqueTickers.length > 0) {
      this.portfolioService.fetchQuotes(uniqueTickers);
    }
  }
}
