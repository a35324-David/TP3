import { Injectable, signal, computed, effect } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

export interface Transaction {
  id: string;
  ticker: string;
  company: string;
  purchaseDate: string;
  quantity: number;
  purchasePrice: number;
}

export interface StockQuote {
  symbol: string;
  price: number;
  changePercent: number;
  company: string;
}

@Injectable({
  providedIn: 'root'
})
export class PortfolioService {
  private apiUrl = 'http://localhost:3000/api';

  // Signals for state management
  portfolioItems = signal<Transaction[]>([]);
  stockQuotes = signal<Record<string, StockQuote>>({});
  priceMode = signal<'demo' | 'live'>('demo');
  isLoading = signal<boolean>(false);
  isBackendConnected = signal<boolean>(true);

  // Computed calculations for the entire portfolio
  totalInvested = computed(() => {
    return this.portfolioItems().reduce((acc, item) => acc + (item.quantity * item.purchasePrice), 0);
  });

  totalCurrentValue = computed(() => {
    return this.portfolioItems().reduce((acc, item) => {
      const quote = this.stockQuotes()[item.ticker];
      const currentPrice = quote ? quote.price : item.purchasePrice;
      return acc + (item.quantity * currentPrice);
    }, 0);
  });

  totalGainLoss = computed(() => {
    return this.totalCurrentValue() - this.totalInvested();
  });

  totalGainLossPercent = computed(() => {
    const invested = this.totalInvested();
    if (invested === 0) return 0;
    return (this.totalCurrentValue() / invested - 1) * 100;
  });

  constructor(private http: HttpClient) {
    // Automatically re-fetch quotes whenever portfolio items or pricing mode change
    effect(() => {
      const tickers = this.portfolioItems().map(item => item.ticker);
      const uniqueTickers = [...new Set(tickers)];
      if (uniqueTickers.length > 0) {
        this.fetchQuotes(uniqueTickers);
      }
    });
  }

  // Load portfolio from server
  async loadPortfolio(): Promise<void> {
    this.isLoading.set(true);
    try {
      const items = await firstValueFrom(this.http.get<Transaction[]>(`${this.apiUrl}/portfolio`));
      this.portfolioItems.set(items || []);
      this.isBackendConnected.set(true);
    } catch (err) {
      console.error('Error loading portfolio:', err);
      this.isBackendConnected.set(false);
    } finally {
      this.isLoading.set(false);
    }
  }

  // Add a new transaction via REST API
  async addTransaction(tx: Omit<Transaction, 'id'>): Promise<boolean> {
    this.isLoading.set(true);
    try {
      const newItem = await firstValueFrom(this.http.post<Transaction>(`${this.apiUrl}/portfolio`, tx));
      this.portfolioItems.update(items => [...items, newItem]);
      this.isBackendConnected.set(true);
      return true;
    } catch (err) {
      console.error('Error adding transaction:', err);
      return false;
    } finally {
      this.isLoading.set(false);
    }
  }

  // Delete a transaction via REST API
  async deleteTransaction(id: string): Promise<boolean> {
    this.isLoading.set(true);
    try {
      await firstValueFrom(this.http.delete(`${this.apiUrl}/portfolio/${id}`));
      this.portfolioItems.update(items => items.filter(item => item.id !== id));
      this.isBackendConnected.set(true);
      return true;
    } catch (err) {
      console.error('Error deleting transaction:', err);
      return false;
    } finally {
      this.isLoading.set(false);
    }
  }

  // Fetch stock quotes from proxy REST API
  async fetchQuotes(tickers: string[]): Promise<void> {
    if (tickers.length === 0) return;
    const symbolsParam = tickers.join(',');
    const mode = this.priceMode();
    try {
      const quotes = await firstValueFrom(
        this.http.get<StockQuote[]>(`${this.apiUrl}/stocks/quotes?symbols=${symbolsParam}&mode=${mode}`)
      );
      
      const newQuotes: Record<string, StockQuote> = {};
      quotes.forEach(q => {
        newQuotes[q.symbol] = q;
      });

      this.stockQuotes.update(existing => ({
        ...existing,
        ...newQuotes
      }));
      this.isBackendConnected.set(true);
    } catch (err) {
      console.error('Error fetching stock quotes:', err);
    }
  }

  // Change pricing mode ('demo' or 'live')
  setPriceMode(mode: 'demo' | 'live'): void {
    this.priceMode.set(mode);
    const tickers = this.portfolioItems().map(item => item.ticker);
    const uniqueTickers = [...new Set(tickers)];
    if (uniqueTickers.length > 0) {
      this.fetchQuotes(uniqueTickers);
    }
  }

  // Import full portfolio data from a JSON array
  async importPortfolio(data: any[]): Promise<boolean> {
    this.isLoading.set(true);
    try {
      const res = await firstValueFrom(this.http.post<any>(`${this.apiUrl}/portfolio/import`, data));
      await this.loadPortfolio();
      return true;
    } catch (err) {
      console.error('Error importing portfolio:', err);
      return false;
    } finally {
      this.isLoading.set(false);
    }
  }

  // Export URL helper
  getExportUrl(): string {
    return `${this.apiUrl}/portfolio/export`;
  }
}
