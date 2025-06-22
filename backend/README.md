# Ticker Database Backend

A Python backend for managing ticker symbols and their price data using SQLite database.

## Files Structure

- `database.py` - Main database class with SQLite operations
- `api_server.py` - Flask API server providing HTTP endpoints
- `requirements.txt` - Python dependencies
- `tickers_with_prices_2020_05_01.csv` - Ticker symbols data
- `filtered_ticker_price_stats.csv` - Historical price data

## Installation

1. Install required dependencies:
```bash
pip install -r requirements.txt
```

## Usage

### Initialize Database and Load Data

```python
from database import TickerDatabase

# Initialize database
db = TickerDatabase()

# Load tickers from CSV
db.load_tickers_from_csv()

# Load price data from CSV
db.load_prices_from_csv()

# Get database statistics
stats = db.get_database_stats()
print(stats)
```

### Run Database Setup Script

```bash
python database.py
```

This will:
- Create SQLite database (`ticker_database.db`)
- Create tables (`tickers` and `ticker_prices`)
- Load data from CSV files
- Show database statistics

### Start API Server

```bash
python api_server.py
```

The API server will start on `http://localhost:5000`

## Database Schema

### Tickers Table
- `ticker_id` (INTEGER PRIMARY KEY)
- `ticker_symbol` (TEXT NOT NULL UNIQUE)

### Ticker Prices Table
- `id` (INTEGER PRIMARY KEY AUTOINCREMENT)
- `ticker_id` (INTEGER NOT NULL, FOREIGN KEY)
- `ticker_symbol` (TEXT NOT NULL)
- `date` (DATE NOT NULL)
- `close_price` (REAL NOT NULL)

## API Endpoints

### Health Check
- `GET /api/health` - Check if API is running

### Database Statistics
- `GET /api/stats` - Get overall database statistics

### Tickers
- `GET /api/tickers` - Get all available tickers
- `GET /api/ticker/<symbol>` - Get specific ticker info
- `GET /api/search/tickers?q=<query>` - Search tickers by symbol

### Price Data
- `GET /api/ticker/<symbol>/prices` - Get all price data for a ticker
- `GET /api/ticker/<symbol>/prices?start_date=YYYY-MM-DD&end_date=YYYY-MM-DD` - Get price data within date range
- `GET /api/ticker/<symbol>/prices?limit=100` - Get most recent N price records
- `GET /api/ticker/<symbol>/stats` - Get price statistics for a ticker

## Example API Usage

```bash
# Get all tickers
curl http://localhost:5000/api/tickers

# Get AAPL info
curl http://localhost:5000/api/ticker/AAPL

# Get AAPL price statistics
curl http://localhost:5000/api/ticker/AAPL/stats

# Get recent AAPL prices (last 10 records)
curl http://localhost:5000/api/ticker/AAPL/prices?limit=10

# Search for tickers containing "AAP"
curl http://localhost:5000/api/search/tickers?q=AAP
```

## Database Operations

The `TickerDatabase` class provides methods for:

- `load_tickers_from_csv()` - Load ticker symbols from CSV
- `load_prices_from_csv()` - Load price data from CSV (handles large files in chunks)
- `get_ticker_info(symbol)` - Get ticker information
- `get_ticker_prices(symbol, start_date, end_date)` - Get price data with optional date filtering
- `get_price_stats(symbol)` - Get price statistics (min, max, avg, count, date range)
- `get_all_tickers()` - Get all available tickers
- `get_database_stats()` - Get overall database statistics

## Performance Features

- Batch processing for large CSV files
- Database indexing for fast queries
- Chunked CSV reading to handle large files
- Foreign key relationships for data integrity 