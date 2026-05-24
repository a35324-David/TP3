import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PortfolioService } from '../../services/portfolio.service';

@Component({
  selector: 'app-import-export',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="glass-card import-export-card animate-fade-in">
      <h3>Backup & Integração JSON</h3>
      <p class="subtitle">Importe dados a partir de um ficheiro ou exporte o portfólio completo</p>
      
      <div class="actions-wrapper">
        <!-- 1. DRAG AND DROP ZONE -->
        <div 
          class="drop-zone"
          [class.drag-over]="isDragOver()"
          (dragover)="onDragOver($event)"
          (dragleave)="onDragLeave($event)"
          (drop)="onDrop($event)"
          (click)="fileInput.click()">
          
          <input 
            type="file" 
            #fileInput 
            class="hidden-input" 
            accept=".json"
            (change)="onFileSelected($event)" />
            
          <div class="drop-icon">📁</div>
          <div class="drop-text">
            <strong>Arrastar ficheiro JSON</strong> ou <span>clicar para navegar</span>
          </div>
          <span class="file-note">Ficheiros .json contendo lista de transações</span>
        </div>

        <!-- 2. EXPORT AND QUICK TEMPLATES -->
        <div class="export-controls">
          <button class="btn btn-primary w-full" (click)="onExport()">
            📥 Exportar Portfólio (JSON)
          </button>
          
          <div class="info-block">
            <span class="info-title">💡 Nota do Professor:</span>
            <p>O ficheiro de importação deve conter um array de objetos. Exemplo:</p>
            <pre class="code-preview"><code>{{ templateExample }}</code></pre>
          </div>
        </div>
      </div>
      
      <!-- Success/Error Feedback Messages -->
      <div class="feedback-toast toast-success" *ngIf="successMessage()">
        ✅ {{ successMessage() }}
      </div>
      <div class="feedback-toast toast-error" *ngIf="errorMessage()">
        ❌ {{ errorMessage() }}
      </div>
    </div>
  `,
  styles: [`
    .import-export-card {
      margin-bottom: 2rem;
    }

    .import-export-card h3 {
      font-size: 1.15rem;
      font-weight: 700;
      color: var(--text-primary);
    }

    .subtitle {
      font-size: 0.75rem;
      color: var(--text-secondary);
      margin-bottom: 1.25rem;
    }

    .actions-wrapper {
      display: grid;
      grid-template-columns: 1.2fr 0.8fr;
      gap: 1.5rem;
    }

    /* Drag and drop zone */
    .drop-zone {
      border: 2px dashed var(--border-color);
      background: rgba(255, 255, 255, 0.01);
      border-radius: var(--radius-md);
      padding: 1.5rem;
      text-align: center;
      cursor: pointer;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      transition: var(--transition-smooth);
    }

    .drop-zone:hover, .drop-zone.drag-over {
      border-color: var(--accent-primary);
      background: rgba(37, 99, 235, 0.03);
    }

    .drop-icon {
      font-size: 2rem;
      margin-bottom: 0.5rem;
      opacity: 0.7;
      transition: var(--transition-smooth);
    }
    .drop-zone:hover .drop-icon {
      transform: translateY(-3px) scale(1.05);
    }

    .drop-text {
      font-size: 0.85rem;
      color: var(--text-secondary);
    }

    .drop-text strong {
      color: var(--text-primary);
    }

    .drop-text span {
      color: #3b82f6;
      font-weight: 600;
    }

    .file-note {
      font-size: 0.65rem;
      color: var(--text-muted);
      margin-top: 0.4rem;
    }

    .hidden-input {
      display: none;
    }

    /* Export and details panel */
    .export-controls {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .w-full {
      width: 100%;
    }

    .info-block {
      background: rgba(0, 0, 0, 0.15);
      border: 1px solid var(--border-color);
      border-radius: var(--radius-sm);
      padding: 0.85rem;
      font-size: 0.7rem;
      line-height: 1.4;
    }

    .info-title {
      font-weight: 700;
      color: var(--accent-secondary);
      display: block;
      margin-bottom: 0.3rem;
    }

    .code-preview {
      background: rgba(0, 0, 0, 0.25);
      padding: 0.5rem;
      border-radius: 4px;
      font-family: monospace;
      color: var(--text-primary);
      margin-top: 0.4rem;
      overflow-x: auto;
      border: 1px solid rgba(255, 255, 255, 0.04);
    }

    /* Toasts */
    .feedback-toast {
      margin-top: 1rem;
      padding: 0.7rem 1rem;
      border-radius: var(--radius-sm);
      font-size: 0.8rem;
      font-weight: 600;
      animation: fadeIn 0.3s ease-out;
    }

    .toast-success {
      background: var(--color-green-glow);
      border: 1px solid rgba(16, 185, 129, 0.2);
      color: var(--color-green);
    }

    .toast-error {
      background: var(--color-red-glow);
      border: 1px solid rgba(239, 68, 68, 0.2);
      color: var(--color-red);
    }

    @media (max-width: 768px) {
      .actions-wrapper {
        grid-template-columns: 1fr;
      }
    }
  `]
})
export class ImportExportComponent {
  portfolioService = inject(PortfolioService);
  
  isDragOver = signal<boolean>(false);
  successMessage = signal<string>('');
  errorMessage = signal<string>('');

  templateExample = `[\n  {\n    "ticker": "AAPL",\n    "company": "Apple Inc.",\n    "quantity": 10,\n    "purchasePrice": 182.50,\n    "purchaseDate": "2026-04-15"\n  }\n]`;

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver.set(true);
  }

  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver.set(false);
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver.set(false);
    
    const files = event.dataTransfer?.files;
    if (files && files.length > 0) {
      this.processFile(files[0]);
    }
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.processFile(input.files[0]);
    }
  }

  private processFile(file: File): void {
    if (file.type !== 'application/json' && !file.name.endsWith('.json')) {
      this.showFeedback(false, 'Por favor, selecione apenas ficheiros JSON.');
      return;
    }

    const reader = new FileReader();
    reader.onload = async (e: any) => {
      try {
        const parsed = JSON.parse(e.target.result);
        if (!Array.isArray(parsed)) {
          this.showFeedback(false, 'Formato inválido. O JSON deve conter uma lista (array) de transações.');
          return;
        }

        const success = await this.portfolioService.importPortfolio(parsed);
        if (success) {
          this.showFeedback(true, `Portfólio carregado com sucesso (${parsed.length} posições).`);
        } else {
          this.showFeedback(false, 'Falha ao guardar os dados no servidor REST.');
        }
      } catch (err) {
        this.showFeedback(false, 'Erro ao ler o ficheiro JSON. Certifique-se de que o ficheiro está bem formatado.');
      }
    };
    reader.readAsText(file);
  }

  private showFeedback(success: boolean, msg: string): void {
    if (success) {
      this.successMessage.set(msg);
      this.errorMessage.set('');
      setTimeout(() => this.successMessage.set(''), 4000);
    } else {
      this.errorMessage.set(msg);
      this.successMessage.set('');
      setTimeout(() => this.errorMessage.set(''), 4000);
    }
  }

  onExport(): void {
    // Open the export download endpoint in a new window or trigger download natively
    window.open(this.portfolioService.getExportUrl(), '_blank');
    this.showFeedback(true, 'Exportação concluída. O download começará em instantes.');
  }
}
