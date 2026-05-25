const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

const DB_PATH = path.join(__dirname, 'portfolio_db.json');

// Helper to read database
function readDB() {
  try {
    if (!fs.existsSync(DB_PATH)) {
      // If db doesn't exist, create it with initial values
      const initial = [
        {
          "id": "1",
          "ticker": "MSFT",
          "company": "Microsoft",
          "purchaseDate": "2026-03-01",
          "quantity": 20,
          "purchasePrice": 320.00
        },
        {
          "id": "2",
          "ticker": "TSLA",
          "company": "TESLA",
          "purchaseDate": "2026-03-20",
          "quantity": 50,
          "purchasePrice": 220.00
        }
      ];
      fs.writeFileSync(DB_PATH, JSON.stringify(initial, null, 2), 'utf8');
      return initial;
    }
    const data = fs.readFileSync(DB_PATH, 'utf8');
    return JSON.parse(data);
  } catch (err) {
    console.error("Error reading database:", err);
    return [];
  }
}

// Helper to write database
function writeDB(data) {
  try {
    fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2), 'utf8');
    return true;
  } catch (err) {
    console.error("Error writing database:", err);
    return false;
  }
}

// Academic Demo quotes for 05/05/2026 as per assignment guidelines
const ACADEMIC_DEMO_QUOTES = {
  'MSFT': { symbol: 'MSFT', price: 330.00, changePercent: 3.125, company: 'Microsoft' }, // (330-320)/320 = 3.125% -> rounds to 3.1%
  'TSLA': { symbol: 'TSLA', price: 224.00, changePercent: 1.818, company: 'TESLA' }  // (224-220)/220 = 1.818% -> rounds to 1.81%
};

// Generic mock values for other symbols if needed
const FALLBACK_MOCK_QUOTES = {
  'AAPL': { symbol: 'AAPL', price: 182.50, changePercent: 1.25, company: 'Apple Inc.' },
  'AMZN': { symbol: 'AMZN', price: 178.40, changePercent: -0.75, company: 'Amazon.com Inc.' },
  'NVDA': { symbol: 'NVDA', price: 924.80, changePercent: 4.82, company: 'NVIDIA Corporation' },
  'GOOGL': { symbol: 'GOOGL', price: 172.10, changePercent: 0.00, company: 'Alphabet Inc.' },
  'NFLX': { symbol: 'NFLX', price: 610.20, changePercent: -1.45, company: 'Netflix Inc.' }
};

// Fetch live quotes from Yahoo Finance (acts as REST API proxy, eliminating CORS & protecting secrets)
// Fetch live quotes from Yahoo Finance (acts as REST API proxy, eliminating CORS & protecting secrets)
async function getLiveQuote(symbol) {
  try {
    const url = `https://query1.finance.yahoo.com/v7/finance/quote?symbols=${encodeURIComponent(symbol)}`;
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();
    const result = data.quoteResponse?.result?.[0];
    
    if (result) {
      return {
        symbol: result.symbol,
        price: result.regularMarketPrice || 0,
        changePercent: result.regularMarketChangePercent || 0,
        company: result.longName || result.shortName || result.symbol
      };
    }
  } catch (err) {
    console.error(`Live quote failed for ${symbol}, using mock database.`, err);
  }
  return null;
}

// Fetch live stock suggestions from Yahoo Finance Autocomplete
async function searchLiveStocks(query) {
  try {
    const url = `https://query2.finance.yahoo.com/v1/finance/search?q=${encodeURIComponent(query)}&quotesCount=10&newsCount=0`;
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();
    return (data.quotes || [])
      .filter(q => q.symbol && (q.longname || q.shortname || q.name))
      .map(q => ({
        symbol: q.symbol,
        company: q.longname || q.shortname || q.name || q.symbol
      }));
  } catch (err) {
    console.error(`Live search failed for query: ${query}`, err);
    return [];
  }
}

// REST ENDPOINTS

// 1. GET ALL TRANSACTIONS
app.get('/api/portfolio', (req, res) => {
  const data = readDB();
  res.json(data);
});

// 2. ADD A TRANSACTION
app.post('/api/portfolio', (req, res) => {
  const { ticker, company, purchaseDate, quantity, purchasePrice, type } = req.body;
  
  if (!ticker || !quantity || !purchasePrice) {
    return res.status(400).json({ error: "Missing required fields: ticker, quantity, and purchasePrice are mandatory." });
  }

  const numericQty = parseFloat(quantity);
  const numericPrice = parseFloat(purchasePrice);
  const txType = type === 'sell' ? 'sell' : 'buy';

  if (isNaN(numericQty) || numericQty <= 0) {
    return res.status(400).json({ error: "Quantity must be a positive number." });
  }
  if (isNaN(numericPrice) || numericPrice <= 0) {
    return res.status(400).json({ error: "Purchase price must be a positive number." });
  }

  const db = readDB();
  
  // If user is trying to sell, verify if they own enough shares of this ticker
  if (txType === 'sell') {
    const totalOwned = db
      .filter(item => item.ticker === ticker.toUpperCase().trim())
      .reduce((acc, item) => acc + (item.type === 'sell' ? -item.quantity : item.quantity), 0);
    
    if (totalOwned < numericQty) {
      return res.status(400).json({ error: `Insufficient shares. You only own ${totalOwned} shares of ${ticker.toUpperCase().trim()}.` });
    }
  }

  const newTx = {
    id: Date.now().toString(),
    ticker: ticker.toUpperCase().trim(),
    company: company ? company.trim() : ticker.toUpperCase().trim(),
    purchaseDate: purchaseDate || new Date().toISOString().split('T')[0],
    quantity: numericQty,
    purchasePrice: numericPrice,
    type: txType
  };

  db.push(newTx);
  if (writeDB(db)) {
    res.status(201).json(newTx);
  } else {
    res.status(500).json({ error: "Failed to write transaction to database." });
  }
});

// 3. DELETE A TRANSACTION
app.delete('/api/portfolio/:id', (req, res) => {
  const { id } = req.params;
  let db = readDB();
  const initialLength = db.length;
  
  db = db.filter(item => item.id !== id);

  if (db.length === initialLength) {
    return res.status(404).json({ error: "Transaction not found." });
  }

  if (writeDB(db)) {
    res.json({ message: "Transaction deleted successfully.", id });
  } else {
    res.status(500).json({ error: "Failed to update database after deletion." });
  }
});

// 4. GET QUOTES FOR A TICKER LIST OR SINGLE TICKER
app.get('/api/stocks/quotes', async (req, res) => {
  const symbolsQuery = req.query.symbols;

  if (!symbolsQuery) {
    return res.status(400).json({ error: "Missing symbols query parameter (e.g. ?symbols=MSFT,TSLA)" });
  }

  const symbols = symbolsQuery.split(',').map(s => s.trim().toUpperCase());
  const quotes = [];

  for (const sym of symbols) {
    // Attempt live quote fetch directly
    let quote = await getLiveQuote(sym);

    // Fallbacks if external API fails
    if (!quote) {
      quote = ACADEMIC_DEMO_QUOTES[sym] || FALLBACK_MOCK_QUOTES[sym];
    }

    if (!quote) {
      quote = {
        symbol: sym,
        price: 150.00,
        changePercent: 0.00,
        company: sym + " Inc."
      };
    }

    quotes.push(quote);
  }

  res.json(quotes);
});

// 5. SEARCH FOR STOCKS (AUTOCOMPLETE PROXY)
app.get('/api/stocks/search', async (req, res) => {
  const query = req.query.q;
  if (!query || query.trim().length < 1) {
    return res.json([]);
  }
  const results = await searchLiveStocks(query);
  res.json(results);
});

// 5. IMPORT FULL PORTFOLIO DATABASE
app.post('/api/portfolio/import', (req, res) => {
  const data = req.body;
  if (!Array.isArray(data)) {
    return res.status(400).json({ error: "Invalid data format. Expected an array of transactions." });
  }

  // Validate items
  const validated = [];
  for (const item of data) {
    if (!item.ticker || !item.quantity || !item.purchasePrice) {
      continue; // Skip invalid rows
    }
    validated.push({
      id: item.id || Date.now().toString() + Math.random().toString(36).substr(2, 5),
      ticker: item.ticker.toUpperCase().trim(),
      company: item.company ? item.company.trim() : item.ticker.toUpperCase().trim(),
      purchaseDate: item.purchaseDate || new Date().toISOString().split('T')[0],
      quantity: parseFloat(item.quantity) || 1,
      purchasePrice: parseFloat(item.purchasePrice) || 0
    });
  }

  if (writeDB(validated)) {
    res.json({ message: `Successfully imported ${validated.length} transactions.`, count: validated.length });
  } else {
    res.status(500).json({ error: "Failed to write imported data to database." });
  }
});

// 6. EXPORT FULL PORTFOLIO DATABASE (Download)
app.get('/api/portfolio/export', (req, res) => {
  if (!fs.existsSync(DB_PATH)) {
    return res.status(404).json({ error: "Database file not found." });
  }
  res.download(DB_PATH, 'portfolio_export.json');
});

// Start the server
app.listen(PORT, () => {
  console.log(`🚀 Stock REST API Server running at http://localhost:${PORT}`);
});
