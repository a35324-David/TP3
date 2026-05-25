import { Component, EventEmitter, Output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PortfolioService } from '../../services/portfolio.service';

@Component({
  selector: 'app-transaction-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="modal-overlay" (click)="closeModal()">
      <div class="modal-content animate-slide-in" (click)="$event.stopPropagation()">
        <div class="modal-header">
          <div class="header-titles">
            <h2>Adicionar Transação</h2>
            <p>Compre posições e integre na base de dados REST</p>
          </div>
          <button class="close-btn" (click)="closeModal()">×</button>
        </div>

        <form (ngSubmit)="onSubmit()" #txForm="ngForm" class="modal-form">
          
          <!-- Transaction Type Toggle -->
          <div class="form-group">
            <label class="form-label">Tipo de Transação *</label>
            <div class="type-toggle-group">
              <button 
                type="button" 
                class="type-toggle-btn buy-btn" 
                [class.active]="formModel.type === 'buy'" 
                (click)="setTxType('buy')">
                📥 Compra
              </button>
              <button 
                type="button" 
                class="type-toggle-btn sell-btn" 
                [class.active]="formModel.type === 'sell'" 
                (click)="setTxType('sell')">
                📤 Venda
              </button>
            </div>
          </div>

          <!-- Ticker Input -->
          <div class="form-group ticker-container">
            <label class="form-label" for="ticker">Ticker / Símbolo *</label>
            <input 
              type="text" 
              id="ticker" 
              name="ticker"
              class="form-input text-uppercase"
              placeholder="Ex: AAPL, NVDA, AMZN"
              required 
              [(ngModel)]="formModel.ticker"
              #tickerInput="ngModel"
              (ngModelChange)="onTickerChange($event)"
              (focus)="onTickerFocus()"
              (blur)="onTickerBlur()"
              autocomplete="off" />
            
            <div *ngIf="tickerInput.invalid && (tickerInput.dirty || tickerInput.touched)" class="validation-error">
              O símbolo ticker é obrigatório.
            </div>

            <!-- Loading Live Price Badge -->
            <div class="live-price-badge animate-pulse" *ngIf="isLoadingPrice">
              ⚡ A obter preço em tempo real...
            </div>

            <!-- Autocomplete / Recommendations Dropdown -->
            <div class="autocomplete-dropdown" *ngIf="showDropdown && (suggestions.length > 0 || showRecommendations)">
              <div class="dropdown-header">
                {{ showRecommendations ? (formModel.type === 'buy' ? '⭐ Empresas Recomendadas' : '💼 As Minhas Ações Compradas') : '🔍 Resultados da Pesquisa' }}
              </div>
              <div class="dropdown-list">
                <div 
                  class="dropdown-item" 
                  *ngFor="let s of (showRecommendations ? (formModel.type === 'buy' ? recommendedStocks : ownedStocks) : suggestions)"
                  (mousedown)="onTickerSelect(s.symbol, s.company)">
                  <span class="item-symbol">{{ s.symbol }}</span>
                  <span class="item-name">{{ s.company }}</span>
                </div>
              </div>
              <div class="dropdown-empty-info" *ngIf="showRecommendations && formModel.type === 'sell' && ownedStocks.length === 0">
                ⚠️ Não possui nenhuma ação comprada na carteira.
              </div>
            </div>
          </div>

          <!-- Company Name Input -->
          <div class="form-group">
            <label class="form-label" for="company">Nome da Empresa</label>
            <input 
              type="text" 
              id="company" 
              name="company"
              class="form-input"
              placeholder="Ex: Apple Inc."
              [(ngModel)]="formModel.company" />
          </div>

          <div class="form-row">
            <!-- Quantity Input -->
            <div class="form-group col-6">
              <label class="form-label" for="quantity">Quantidade *</label>
              <input 
                type="number" 
                id="quantity" 
                name="quantity"
                class="form-input"
                placeholder="Ex: 10"
                required
                min="0.0001"
                [max]="formModel.type === 'sell' ? (maxQuantityToSell || 0) : ''"
                step="any"
                [(ngModel)]="formModel.quantity"
                #qtyInput="ngModel" />
              
              <!-- Owned quantity helper -->
              <div class="owned-qty-helper" *ngIf="formModel.type === 'sell' && formModel.ticker">
                Disponível: <strong>{{ maxQuantityToSell }}</strong> ações
              </div>

              <div *ngIf="qtyInput.invalid && (qtyInput.dirty || qtyInput.touched)" class="validation-error">
                <span *ngIf="qtyInput.errors?.['required']">Indique uma quantidade maior que zero.</span>
                <span *ngIf="qtyInput.errors?.['min']">Indique uma quantidade maior que zero.</span>
                <span *ngIf="qtyInput.errors?.['max']">Não pode vender mais do que as {{ maxQuantityToSell }} ações que possui!</span>
              </div>
            </div>

            <!-- Unit Price Input -->
            <div class="form-group col-6">
              <label class="form-label" for="purchasePrice">
                {{ formModel.type === 'buy' ? 'Preço de Compra' : 'Preço de Venda' }} (PU USD) *
              </label>
              <input 
                type="number" 
                id="purchasePrice" 
                name="purchasePrice"
                class="form-input"
                placeholder="Ex: 180.50"
                required
                min="0.01"
                [max]="formModel.type === 'sell' ? (currentMarketPrice || 999999) : ''"
                step="any"
                [(ngModel)]="formModel.purchasePrice"
                #priceInput="ngModel" />
              
              <!-- Market price helper for sales -->
              <div class="owned-qty-helper" *ngIf="formModel.type === 'sell' && formModel.ticker && currentMarketPrice">
                Preço Atual: <strong>{{ currentMarketPrice | currency:'USD':'symbol':'1.2-2' }}</strong>
              </div>

              <div *ngIf="priceInput.invalid && (priceInput.dirty || priceInput.touched)" class="validation-error">
                <span *ngIf="priceInput.errors?.['required']">O preço é obrigatório.</span>
                <span *ngIf="priceInput.errors?.['min']">Indique um preço maior que zero.</span>
                <span *ngIf="priceInput.errors?.['max']">O preço de venda não pode ser superior à cotação atual de {{ currentMarketPrice | currency:'USD':'symbol':'1.2-2' }}!</span>
              </div>
            </div>
          </div>

          <!-- Purchase Date Input -->
          <div class="form-group">
            <label class="form-label" for="purchaseDate">Data de Transação *</label>
            <input 
              type="date" 
              id="purchaseDate" 
              name="purchaseDate"
              class="form-input"
              required
              [(ngModel)]="formModel.purchaseDate"
              #dateInput="ngModel" />
            <div *ngIf="dateInput.invalid && (dateInput.dirty || dateInput.touched)" class="validation-error">
              Data de transação é obrigatória.
            </div>
          </div>

          <!-- Cost Preview Box -->
          <div class="preview-box" *ngIf="formModel.quantity && formModel.purchasePrice">
            <span>{{ formModel.type === 'buy' ? 'Custo Total Estimado:' : 'Retorno Total Estimado:' }}</span>
            <strong [class.color-green-text]="formModel.type === 'sell'">
              {{ (formModel.quantity * formModel.purchasePrice) | currency:'USD':'symbol':'1.2-2' }}
            </strong>
          </div>

          <!-- Actions -->
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" (click)="closeModal()">Cancelar</button>
            <button 
              type="submit" 
              class="btn" 
              [class.btn-primary]="formModel.type === 'buy'"
              [class.btn-danger]="formModel.type === 'sell'"
              [disabled]="txForm.invalid || isLoadingPrice">
              {{ formModel.type === 'buy' ? 'Submeter Compra' : 'Submeter Venda' }}
            </button>
          </div>

        </form>
      </div>
    </div>
  `,
  styles: [`
    .modal-overlay {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.6);
      backdrop-filter: blur(4px);
      display: flex;
      justify-content: flex-end;
      align-items: stretch;
      z-index: 1000;
      animation: fadeIn 0.25s ease-out;
    }

    .modal-content {
      background: #0f172a;
      width: 100%;
      max-width: 460px;
      border-left: 1px solid var(--border-color);
      display: flex;
      flex-direction: column;
      padding: 2rem;
      box-shadow: -10px 0 30px rgba(0, 0, 0, 0.4);
      position: relative;
    }

    @keyframes slideIn {
      from { transform: translateX(100%); }
      to { transform: translateX(0); }
    }

    .animate-slide-in {
      animation: slideIn 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards;
    }

    .modal-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 1.5rem;
    }

    .header-titles h2 {
      font-size: 1.35rem;
      font-weight: 700;
      color: #ffffff;
    }

    .header-titles p {
      font-size: 0.75rem;
      color: var(--text-secondary);
      margin-top: 0.2rem;
    }

    .close-btn {
      background: transparent;
      border: none;
      color: var(--text-secondary);
      font-size: 1.8rem;
      cursor: pointer;
      line-height: 0.8;
      transition: var(--transition-smooth);
    }
    .close-btn:hover {
      color: #ffffff;
      transform: scale(1.1);
    }

    .modal-form {
      display: flex;
      flex-direction: column;
      flex: 1;
    }

    /* Type toggle switches */
    .type-toggle-group {
      display: flex;
      background: rgba(255, 255, 255, 0.03);
      border: 1px solid var(--border-color);
      border-radius: var(--radius-sm);
      padding: 0.25rem;
      gap: 0.25rem;
    }

    .type-toggle-btn {
      flex: 1;
      border: none;
      background: transparent;
      color: var(--text-muted);
      font-family: var(--font-display);
      font-weight: 700;
      font-size: 0.8rem;
      padding: 0.5rem;
      border-radius: 4px;
      cursor: pointer;
      transition: var(--transition-smooth);
    }

    .type-toggle-btn.active.buy-btn {
      background: rgba(16, 185, 129, 0.15);
      color: #34d399;
      border: 1px solid rgba(16, 185, 129, 0.3);
      box-shadow: 0 0 10px rgba(16, 185, 129, 0.1);
    }

    .type-toggle-btn.active.sell-btn {
      background: rgba(239, 68, 68, 0.15);
      color: #f87171;
      border: 1px solid rgba(239, 68, 68, 0.3);
      box-shadow: 0 0 10px rgba(239, 68, 68, 0.1);
    }

    .form-row {
      display: flex;
      gap: 1rem;
    }

    .col-6 {
      flex: 0 0 calc(50% - 0.5rem);
    }

    .text-uppercase {
      text-transform: uppercase;
    }

    .validation-error {
      color: var(--color-red);
      font-size: 0.7rem;
      font-weight: 600;
      margin-top: 0.25rem;
    }

    /* Autocomplete dropdown styles */
    .ticker-container {
      position: relative;
    }

    .live-price-badge {
      font-size: 0.7rem;
      color: #38bdf8;
      background: rgba(56, 189, 248, 0.15);
      padding: 0.25rem 0.5rem;
      border-radius: 4px;
      display: inline-block;
      margin-top: 0.4rem;
      font-weight: 700;
    }

    .autocomplete-dropdown {
      position: absolute;
      top: 100%;
      left: 0;
      width: 100%;
      background: #1e293b;
      border: 1px solid var(--border-color);
      border-radius: var(--radius-sm);
      z-index: 50;
      box-shadow: 0 10px 25px rgba(0, 0, 0, 0.5);
      max-height: 220px;
      overflow-y: auto;
      margin-top: 0.25rem;
    }

    .dropdown-header {
      font-size: 0.65rem;
      color: var(--text-muted);
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      padding: 0.5rem 0.75rem;
      border-bottom: 1px solid rgba(255, 255, 255, 0.05);
      background: rgba(0, 0, 0, 0.15);
    }

    .dropdown-empty-info {
      font-size: 0.75rem;
      color: var(--text-muted);
      text-align: center;
      padding: 1.5rem 1rem;
    }

    .owned-qty-helper {
      font-size: 0.7rem;
      color: #94a3b8;
      margin-top: 0.25rem;
      font-weight: 500;
    }

    .owned-qty-helper strong {
      color: #f87171;
      font-weight: 700;
    }

    .dropdown-list {
      display: flex;
      flex-direction: column;
    }

    .dropdown-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 0.6rem 0.75rem;
      cursor: pointer;
      transition: var(--transition-smooth);
      border-bottom: 1px solid rgba(255, 255, 255, 0.02);
    }

    .dropdown-item:hover {
      background: rgba(255, 255, 255, 0.05);
    }

    .item-symbol {
      font-family: var(--font-display);
      font-weight: 700;
      color: #38bdf8;
      font-size: 0.85rem;
      background: rgba(56, 189, 248, 0.1);
      padding: 0.15rem 0.35rem;
      border-radius: 4px;
    }

    .item-name {
      font-size: 0.75rem;
      color: var(--text-primary);
      text-align: right;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      max-width: 250px;
    }

    /* Cost preview */
    .preview-box {
      background: rgba(255, 255, 255, 0.02);
      border: 1px dashed var(--border-color);
      border-radius: var(--radius-sm);
      padding: 1rem;
      margin-top: 1rem;
      margin-bottom: 1.5rem;
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 0.85rem;
    }

    .preview-box span {
      color: var(--text-secondary);
    }

    .preview-box strong {
      font-size: 1.1rem;
      color: #3b82f6;
      font-family: var(--font-display);
    }

    .color-green-text {
      color: #10b981 !important;
    }

    .btn-danger {
      background: #ef4444;
      color: white;
    }
    .btn-danger:hover {
      background: #dc2626;
      box-shadow: 0 4px 15px rgba(239, 68, 68, 0.4);
    }

    .modal-footer {
      display: flex;
      gap: 1rem;
      margin-top: auto;
      justify-content: flex-end;
    }

    .modal-footer button {
      min-width: 120px;
    }

    @media (max-width: 480px) {
      .modal-content {
        max-width: 100%;
        padding: 1.5rem;
      }
      .form-row {
        flex-direction: column;
        gap: 0;
      }
      .col-6 {
        flex: 1 1 100%;
      }
    }
  `]
})
export class TransactionModalComponent {
  portfolioService = inject(PortfolioService);
  
  @Output() close = new EventEmitter<void>();

  // Default initial fields
  formModel = {
    type: 'buy' as 'buy' | 'sell',
    ticker: '',
    company: '',
    quantity: null as number | null,
    purchasePrice: null as number | null,
    purchaseDate: new Date().toISOString().split('T')[0]
  };

  showDropdown = false;
  showRecommendations = false;
  isLoadingPrice = false;
  suggestions: any[] = [];

  // Popular companies to suggest immediately on focus when buying
  recommendedStocks = [
    { symbol: 'AAPL', company: 'Apple Inc.' },
    { symbol: 'MSFT', company: 'Microsoft Corporation' },
    { symbol: 'TSLA', company: 'TESLA Inc.' },
    { symbol: 'NVDA', company: 'NVIDIA Corporation' },
    { symbol: 'AMZN', company: 'Amazon.com Inc.' },
    { symbol: 'GOOGL', company: 'Alphabet Inc.' },
    { symbol: 'META', company: 'Meta Platforms Inc.' },
    { symbol: 'NFLX', company: 'Netflix Inc.' }
  ];

  // Dynamically group portfolio to identify currently owned shares
  get ownedStocks(): { symbol: string, company: string, qty: number }[] {
    const items = this.portfolioService.portfolioItems();
    const group: Record<string, { symbol: string, company: string, qty: number }> = {};
    
    items.forEach(item => {
      const multiplier = item.type === 'sell' ? -1 : 1;
      const cleanTicker = item.ticker.trim().toUpperCase();
      if (!group[cleanTicker]) {
        group[cleanTicker] = { symbol: cleanTicker, company: item.company, qty: 0 };
      }
      group[cleanTicker].qty += multiplier * item.quantity;
    });

    return Object.values(group).filter(g => g.qty > 0);
  }

  // Get the maximum available shares for the selected stock to sell
  get maxQuantityToSell(): number | null {
    if (this.formModel.type !== 'sell' || !this.formModel.ticker) {
      return null;
    }
    const owned = this.ownedStocks.find(s => s.symbol.toUpperCase() === this.formModel.ticker.toUpperCase());
    return owned ? owned.qty : 0;
  }

  // Get the current real-time market price of the selected stock
  get currentMarketPrice(): number | null {
    if (!this.formModel.ticker) return null;
    const quote = this.portfolioService.stockQuotes()[this.formModel.ticker.toUpperCase()];
    return quote ? quote.price : null;
  }

  setTxType(type: 'buy' | 'sell'): void {
    this.formModel.type = type;
    
    // Reset autocomplete/inputs to avoid confusion between tabs
    this.formModel.ticker = '';
    this.formModel.company = '';
    this.formModel.quantity = null;
    this.formModel.purchasePrice = null;
    this.suggestions = [];
    this.showRecommendations = true;
  }

  async onTickerChange(ticker: string): Promise<void> {
    if (!ticker || ticker.trim().length === 0) {
      this.suggestions = [];
      this.showRecommendations = true;
      return;
    }
    
    this.showRecommendations = false;
    
    // 1. Instant Local Matching
    const cleanTicker = ticker.trim().toUpperCase();
    const localList = this.formModel.type === 'sell' ? this.ownedStocks : this.recommendedStocks;
    const localFiltered = localList.filter(s => 
      s.symbol.includes(cleanTicker) || 
      s.company.toUpperCase().includes(cleanTicker)
    );

    this.suggestions = [...localFiltered];

    // 2. Fetch remote search results from Yahoo search proxy in background
    const results = await this.portfolioService.searchStocks(ticker);
    
    // Merge remote results avoiding duplicates
    const merged = [...this.suggestions];
    results.forEach(res => {
      if (!merged.some(m => m.symbol.toUpperCase() === res.symbol.toUpperCase())) {
        merged.push(res);
      }
    });
    
    this.suggestions = merged;
  }

  onTickerFocus(): void {
    this.showDropdown = true;
    if (!this.formModel.ticker) {
      this.showRecommendations = true;
    }
  }

  onTickerBlur(): void {
    // Blur has a slight delay to allow mousedown to fire first
    setTimeout(() => {
      this.showDropdown = false;
    }, 250);
  }

  async onTickerSelect(ticker: string, company: string): Promise<void> {
    this.formModel.ticker = ticker.toUpperCase();
    this.formModel.company = company;
    this.showDropdown = false;
    this.suggestions = [];

    // Fetch the live price for this stock to auto-fill the Unit Price!
    this.isLoadingPrice = true;
    try {
      await this.portfolioService.fetchQuotes([ticker]);
      const quote = this.portfolioService.stockQuotes()[ticker];
      if (quote) {
        this.formModel.purchasePrice = quote.price;
        if (quote.company) {
          this.formModel.company = quote.company;
        }
      }
    } catch (err) {
      console.error('Failed to pre-fetch stock quote:', err);
    } finally {
      this.isLoadingPrice = false;
    }
  }

  closeModal(): void {
    this.close.emit();
  }

  async onSubmit(): Promise<void> {
    const success = await this.portfolioService.addTransaction({
      ticker: this.formModel.ticker.toUpperCase().trim(),
      company: this.formModel.company.trim() || this.formModel.ticker.toUpperCase().trim(),
      quantity: Number(this.formModel.quantity),
      purchasePrice: Number(this.formModel.purchasePrice),
      purchaseDate: this.formModel.purchaseDate,
      type: this.formModel.type
    });

    if (success) {
      this.closeModal();
    } else {
      alert('Erro ao guardar a transação. Por favor verifique a ligação ou se tem saldo de ações suficiente no caso de venda.');
    }
  }
}
