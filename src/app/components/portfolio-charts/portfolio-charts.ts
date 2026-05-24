import { Component, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PortfolioService } from '../../services/portfolio.service';

interface DonutSlice {
  ticker: string;
  value: number;
  percentage: number;
  dashArray: string;
  dashOffset: number;
  color: string;
}

@Component({
  selector: 'app-portfolio-charts',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="charts-grid animate-fade-in" *ngIf="portfolioService.portfolioItems().length > 0">
      
      <!-- 1. DONUT CHART (Asset Allocation Weight) -->
      <div class="glass-card chart-card">
        <h3>Distribuição de Carteira (Asset Weight)</h3>
        <p class="chart-subtitle">Alocação de ativos baseada no valor atual total</p>
        
        <div class="donut-container">
          <div class="donut-svg-wrapper">
            <svg viewBox="0 0 160 160" class="donut-svg">
              <!-- Background base circle -->
              <circle cx="80" cy="80" r="50" fill="transparent" stroke="rgba(255,255,255,0.03)" stroke-width="16" />
              
              <!-- Dynamic slices -->
              <circle *ngFor="let slice of donutSlices()"
                cx="80" cy="80" r="50"
                fill="transparent"
                [attr.stroke]="slice.color"
                stroke-width="16"
                [attr.stroke-dasharray]="slice.dashArray"
                [attr.stroke-dashoffset]="slice.dashOffset"
                transform="rotate(-90 80 80)"
                stroke-linecap="round"
                class="donut-segment" />
            </svg>
            <div class="donut-center-labels">
              <span class="center-value">{{ totalCount() }}</span>
              <span class="center-label">Posições</span>
            </div>
          </div>
          
          <div class="donut-legend">
            <div class="legend-item" *ngFor="let slice of donutSlices()">
              <div class="legend-color" [style.background-color]="slice.color"></div>
              <div class="legend-details">
                <span class="legend-ticker">{{ slice.ticker }}</span>
                <span class="legend-pct">{{ slice.percentage | number:'1.1-1' }}%</span>
              </div>
              <span class="legend-value">{{ slice.value | currency:'USD':'symbol':'1.0-0' }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- 2. COST VS VALUE COMPARISON GAUGE -->
      <div class="glass-card chart-card">
        <h3>Performance & Desempenho Visual</h3>
        <p class="chart-subtitle">Comparação direta entre custo total e valor de mercado</p>
        
        <div class="comparison-container">
          <!-- KPI Metrics inside chart -->
          <div class="metric-line">
            <div class="metric-info">
              <span class="metric-label">Valor total investido (Custo)</span>
              <span class="metric-value color-blue">{{ portfolioService.totalInvested() | currency:'USD':'symbol':'1.2-2' }}</span>
            </div>
            <div class="bar-track">
              <div class="bar-fill fill-blue" [style.width.%]="costBarPercent()"></div>
            </div>
          </div>

          <div class="metric-line">
            <div class="metric-info">
              <span class="metric-label">Valor atual da carteira</span>
              <span class="metric-value color-green">{{ portfolioService.totalCurrentValue() | currency:'USD':'symbol':'1.2-2' }}</span>
            </div>
            <div class="bar-track">
              <div class="bar-fill fill-green" [style.width.%]="valueBarPercent()"></div>
            </div>
          </div>

          <!-- Profit Bar -->
          <div class="net-return-box" [ngClass]="portfolioService.totalGainLoss() >= 0 ? 'box-gain' : 'box-loss'">
            <div class="return-header">
              <span>Retorno Líquido do Portfólio</span>
              <span class="return-percent font-bold">
                {{ portfolioService.totalGainLoss() >= 0 ? '▲' : '▼' }} 
                {{ portfolioService.totalGainLossPercent() | number:'1.2-2' }}%
              </span>
            </div>
            <div class="return-details">
              <span>Crescimento absoluto de: </span>
              <span class="font-bold">
                {{ portfolioService.totalGainLoss() | currency:'USD':'symbol':'1.2-2' }}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .charts-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 1.25rem;
      margin-bottom: 2rem;
    }

    .chart-card {
      padding: 1.5rem;
    }

    .chart-card h3 {
      font-size: 1.15rem;
      font-weight: 700;
      color: var(--text-primary);
    }

    .chart-subtitle {
      font-size: 0.75rem;
      color: var(--text-secondary);
      margin-bottom: 1.5rem;
    }

    /* Donut container mechanics */
    .donut-container {
      display: flex;
      align-items: center;
      justify-content: space-around;
      gap: 1.5rem;
      min-height: 180px;
    }

    .donut-svg-wrapper {
      position: relative;
      width: 140px;
      height: 140px;
      flex-shrink: 0;
    }

    .donut-svg {
      width: 100%;
      height: 100%;
    }

    .donut-segment {
      transition: stroke-dashoffset 0.6s ease-in-out, stroke 0.3s ease;
    }

    .donut-center-labels {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      display: flex;
      flex-direction: column;
      align-items: center;
      line-height: 1.1;
    }

    .center-value {
      font-size: 1.5rem;
      font-family: var(--font-display);
      font-weight: 800;
      color: var(--text-primary);
    }

    .center-label {
      font-size: 0.65rem;
      color: var(--text-muted);
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    .donut-legend {
      display: flex;
      flex-direction: column;
      gap: 0.6rem;
      width: 100%;
      max-width: 180px;
    }

    .legend-item {
      display: flex;
      align-items: center;
      font-size: 0.8rem;
    }

    .legend-color {
      width: 10px;
      height: 10px;
      border-radius: 3px;
      margin-right: 0.6rem;
      flex-shrink: 0;
    }

    .legend-details {
      display: flex;
      flex-direction: column;
      flex: 1;
    }

    .legend-ticker {
      font-weight: 700;
      color: var(--text-primary);
      line-height: 1.2;
    }

    .legend-pct {
      font-size: 0.65rem;
      color: var(--text-secondary);
    }

    .legend-value {
      font-weight: 600;
      font-family: var(--font-display);
      color: var(--text-secondary);
    }

    /* Comparison Bar Chart structures */
    .comparison-container {
      display: flex;
      flex-direction: column;
      gap: 1.2rem;
    }

    .metric-line {
      display: flex;
      flex-direction: column;
      gap: 0.4rem;
    }

    .metric-info {
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 0.8rem;
      font-weight: 600;
    }

    .metric-label {
      color: var(--text-secondary);
    }

    .metric-value {
      font-family: var(--font-display);
      font-size: 0.95rem;
    }

    .color-blue {
      color: #3b82f6;
    }

    .color-green {
      color: #10b981;
    }

    .bar-track {
      width: 100%;
      height: 10px;
      background: rgba(255, 255, 255, 0.04);
      border-radius: 9999px;
      overflow: hidden;
      border: 1px solid var(--border-color);
    }

    .bar-fill {
      height: 100%;
      border-radius: 9999px;
      transition: width 0.8s cubic-bezier(0.16, 1, 0.3, 1);
    }

    .fill-blue {
      background: linear-gradient(90deg, #3b82f6, #60a5fa);
      box-shadow: 0 0 8px rgba(59, 130, 246, 0.3);
    }

    .fill-green {
      background: linear-gradient(90deg, #10b981, #34d399);
      box-shadow: 0 0 8px rgba(16, 185, 129, 0.3);
    }

    /* Return Box */
    .net-return-box {
      padding: 0.85rem 1rem;
      border-radius: var(--radius-sm);
      font-size: 0.8rem;
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
      margin-top: 0.4rem;
      transition: var(--transition-smooth);
    }

    .box-gain {
      background: var(--color-green-glow);
      border: 1px solid rgba(16, 185, 129, 0.15);
      color: var(--color-green);
    }

    .box-loss {
      background: var(--color-red-glow);
      border: 1px solid rgba(239, 68, 68, 0.15);
      color: var(--color-red);
    }

    .return-header {
      display: flex;
      justify-content: space-between;
      font-weight: 600;
    }

    .return-percent {
      font-family: var(--font-display);
      font-size: 0.95rem;
    }

    .return-details {
      font-size: 0.75rem;
      opacity: 0.85;
    }

    .font-bold {
      font-weight: 700;
    }

    @media (max-width: 900px) {
      .charts-grid {
        grid-template-columns: 1fr;
      }
      .donut-container {
        justify-content: center;
        gap: 2rem;
      }
    }
  `]
})
export class PortfolioChartsComponent {
  portfolioService = inject(PortfolioService);

  totalCount = computed(() => this.portfolioService.portfolioItems().length);

  // Computes the proportional SVG segment parameters reactively
  donutSlices = computed<DonutSlice[]>(() => {
    const items = this.portfolioService.portfolioItems();
    const quotes = this.portfolioService.stockQuotes();
    const total = this.portfolioService.totalCurrentValue();
    if (total === 0 || items.length === 0) return [];

    // Group current valuations by symbol
    const group: Record<string, number> = {};
    items.forEach(item => {
      const quote = quotes[item.ticker];
      const currentPrice = quote ? quote.price : item.purchasePrice;
      group[item.ticker] = (group[item.ticker] || 0) + (item.quantity * currentPrice);
    });

    const circumference = 314.159; // 2 * PI * r (where r = 50)
    let accumulatedOffset = 0;
    
    // Curated sleek palettes for asset visualization
    const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6', '#06b6d4', '#14b8a6'];

    return Object.keys(group).map((ticker, index) => {
      const val = group[ticker];
      const pct = val / total;
      const dashOffset = accumulatedOffset;
      // SVG dash offset decreases counter-clockwise
      accumulatedOffset -= pct * circumference;

      return {
        ticker,
        value: val,
        percentage: pct * 100,
        dashArray: `${pct * circumference} ${circumference}`,
        dashOffset,
        color: colors[index % colors.length]
      };
    });
  });

  // Scale the cost / value bars inside UI comparison grid
  costBarPercent = computed(() => {
    const cost = this.portfolioService.totalInvested();
    const val = this.portfolioService.totalCurrentValue();
    if (cost === 0 && val === 0) return 0;
    return cost >= val ? 100 : (cost / val) * 100;
  });

  valueBarPercent = computed(() => {
    const cost = this.portfolioService.totalInvested();
    const val = this.portfolioService.totalCurrentValue();
    if (cost === 0 && val === 0) return 0;
    return val >= cost ? 100 : (val / cost) * 100;
  });
}
