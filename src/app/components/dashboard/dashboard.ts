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
    <div class="dashboard-wrapper animate-fade-in">
      
      <!-- ── Header ─────────────────────────────────────── -->
      <div class="dashboard-banner">
        <div class="greeting-box">
          <h2>A minha Carteira</h2>
          <p>Atualizada em tempo real · API REST</p>
        </div>
        <div class="banner-actions">
          <button class="btn btn-secondary" (click)="refreshPrices()">
            🔄 Atualizar
          </button>
          <button class="btn btn-primary" (click)="isModalOpen.set(true)">
            + Comprar Ação
          </button>
        </div>
      </div>

      <!-- ── ROW 1: KPI Cards (full width) ──────────────── -->
      <app-summary-cards></app-summary-cards>

      <!-- ── ROW 2: Bento split ──────────────────────────── -->
      <div class="bento-row">
        <!-- Gráficos — ocupa 3/5 -->
        <div class="bento-charts">
          <app-portfolio-charts></app-portfolio-charts>
        </div>
        <!-- Import/Export — ocupa 2/5 -->
        <div class="bento-tools">
          <app-import-export></app-import-export>
        </div>
      </div>

      <!-- ── ROW 3: Tabela (full width) ─────────────────── -->
      <app-portfolio-table></app-portfolio-table>

      <!-- Modal slide-out -->
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
      gap: 1.5rem;
    }

    /* ─── Header ───────────────────────────────────────── */
    .dashboard-banner {
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 1rem;
      padding-bottom: 1.5rem;
      border-bottom: 1px solid var(--border-color);
    }

    .greeting-box h2 {
      font-size: 1.4rem;
      font-weight: 400;
      color: var(--text-primary);
      letter-spacing: -0.03em;
    }

    .greeting-box p {
      font-size: 0.8rem;
      color: var(--text-muted);
      margin-top: 0.2rem;
    }

    .banner-actions {
      display: flex;
      gap: 0.6rem;
    }

    /* ─── Bento Row (Gráficos + Ferramentas) ───────────── */
    .bento-row {
      display: grid;
      grid-template-columns: 3fr 2fr;
      gap: 1.5rem;
      align-items: start;
    }

    .bento-charts,
    .bento-tools {
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
    }

    /* ─── Responsivo ────────────────────────────────────── */
    @media (max-width: 1100px) {
      .bento-row {
        grid-template-columns: 1fr;
      }
    }

    @media (max-width: 600px) {
      .dashboard-banner {
        flex-direction: column;
        align-items: flex-start;
      }
      .banner-actions { width: 100%; }
      .banner-actions button { flex: 1; }
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
