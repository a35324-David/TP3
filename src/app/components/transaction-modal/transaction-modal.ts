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
          
          <!-- Ticker Input -->
          <div class="form-group">
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
              autocomplete="off" />
            <div *ngIf="tickerInput.invalid && (tickerInput.dirty || tickerInput.touched)" class="validation-error">
              O símbolo ticker é obrigatório.
            </div>
            <!-- Quick Suggestion Auto-fill Banner -->
            <div class="suggestion-chip" *ngIf="tickerSuggestion" (click)="applySuggestion()">
              ✨ Auto-completar: <strong>{{ tickerSuggestion }}</strong>
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
              <label class="form-label" for="quantity">Quantidade (QT) *</label>
              <input 
                type="number" 
                id="quantity" 
                name="quantity"
                class="form-input"
                placeholder="Ex: 10"
                required
                min="0.0001"
                step="any"
                [(ngModel)]="formModel.quantity"
                #qtyInput="ngModel" />
              <div *ngIf="qtyInput.invalid && (qtyInput.dirty || qtyInput.touched)" class="validation-error">
                Indique uma quantidade maior que zero.
              </div>
            </div>

            <!-- Unit Price Input -->
            <div class="form-group col-6">
              <label class="form-label" for="purchasePrice">Preço Unitário (PU USD) *</label>
              <input 
                type="number" 
                id="purchasePrice" 
                name="purchasePrice"
                class="form-input"
                placeholder="Ex: 180.50"
                required
                min="0.01"
                step="any"
                [(ngModel)]="formModel.purchasePrice"
                #priceInput="ngModel" />
              <div *ngIf="priceInput.invalid && (priceInput.dirty || priceInput.touched)" class="validation-error">
                Indique um preço maior que zero.
              </div>
            </div>
          </div>

          <!-- Purchase Date Input -->
          <div class="form-group">
            <label class="form-label" for="purchaseDate">Data da Compra *</label>
            <input 
              type="date" 
              id="purchaseDate" 
              name="purchaseDate"
              class="form-input"
              required
              [(ngModel)]="formModel.purchaseDate"
              #dateInput="ngModel" />
            <div *ngIf="dateInput.invalid && (dateInput.dirty || dateInput.touched)" class="validation-error">
              Data de compra é obrigatória.
            </div>
          </div>

          <!-- Cost Preview Box -->
          <div class="preview-box" *ngIf="formModel.quantity && formModel.purchasePrice">
            <span>Pré-visualização do Custo:</span>
            <strong>{{ (formModel.quantity * formModel.purchasePrice) | currency:'USD':'symbol':'1.2-2' }}</strong>
          </div>

          <!-- Actions -->
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" (click)="closeModal()">Cancelar</button>
            <button 
              type="submit" 
              class="btn btn-primary" 
              [disabled]="txForm.invalid">
              Submeter Posição
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
      margin-bottom: 2rem;
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

    /* Auto-fill banner */
    .suggestion-chip {
      background: rgba(6, 182, 212, 0.1);
      border: 1px solid rgba(6, 182, 212, 0.2);
      color: var(--accent-secondary);
      font-size: 0.75rem;
      padding: 0.35rem 0.6rem;
      border-radius: 6px;
      margin-top: 0.4rem;
      cursor: pointer;
      transition: var(--transition-smooth);
    }
    .suggestion-chip:hover {
      background: rgba(6, 182, 212, 0.2);
      transform: translateY(-1px);
    }

    /* Prev box */
    .preview-box {
      background: rgba(255, 255, 255, 0.02);
      border: 1px dashed var(--border-color);
      border-radius: var(--radius-sm);
      padding: 1rem;
      margin-top: 1.5rem;
      margin-bottom: 2rem;
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
    ticker: '',
    company: '',
    quantity: null as number | null,
    purchasePrice: null as number | null,
    purchaseDate: new Date().toISOString().split('T')[0]
  };

  tickerSuggestion = '';

  // Autocomplete mapping helper
  private tickerDictionary: Record<string, string> = {
    'AAPL': 'Apple Inc.',
    'MSFT': 'Microsoft Corporation',
    'TSLA': 'TESLA Inc.',
    'NVDA': 'NVIDIA Corporation',
    'AMZN': 'Amazon.com Inc.',
    'GOOGL': 'Alphabet Inc. (Google)',
    'NFLX': 'Netflix Inc.',
    'META': 'Meta Platforms Inc. (Facebook)',
    'AMD': 'Advanced Micro Devices',
    'BABA': 'Alibaba Group Holding'
  };

  onTickerChange(ticker: string): void {
    if (!ticker) {
      this.tickerSuggestion = '';
      return;
    }
    const cleanTicker = ticker.trim().toUpperCase();
    if (this.tickerDictionary[cleanTicker]) {
      this.tickerSuggestion = this.tickerDictionary[cleanTicker];
    } else {
      this.tickerSuggestion = '';
    }
  }

  applySuggestion(): void {
    if (this.tickerSuggestion) {
      this.formModel.company = this.tickerSuggestion;
      this.tickerSuggestion = ''; // Clear suggestion once applied
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
      purchaseDate: this.formModel.purchaseDate
    });

    if (success) {
      this.closeModal();
    } else {
      alert('Erro ao guardar a transação no servidor REST. Por favor verifique a ligação.');
    }
  }
}
