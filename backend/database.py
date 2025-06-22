import sqlite3
from typing import List, Tuple, Optional

class BigBird_portfolio_database:
    def __init__(self, db_path: str = "bigbird_portfolio_database.db"):
        """Initialize connection to existing ticker database."""
        self.db_path = db_path
        self.conn = None
        self.connect()
    
    def connect(self):
        """Connect to the SQLite database."""
        try:
            self.conn = sqlite3.connect(self.db_path, check_same_thread=False)
            self.cursor = self.conn.cursor()
            print(f"Connected to database: {self.db_path}")
        except sqlite3.Error as e:
            print(f"Error connecting to database: {e}")
            raise e
    
    def get_ticker_info(self, ticker_symbol: str) -> Optional[Tuple]:
        """Get ticker information by symbol."""
        try:
            cursor = self.conn.cursor()
            cursor.execute('''
                SELECT ticker_id, ticker_symbol FROM tickers 
                WHERE ticker_symbol = ?
            ''', (ticker_symbol,))
            result = cursor.fetchone()
            cursor.close()
            return result
        except sqlite3.Error as e:
            print(f"Error getting ticker info: {e}")
            return None
    
    def get_ticker_prices(self, ticker_symbol: str, start_date: str = None, end_date: str = None) -> List[Tuple]:
        """Get price data for a specific ticker within date range."""
        try:
            cursor = self.conn.cursor()
            query = '''
                SELECT ticker_id, ticker_symbol, date, close_price 
                FROM ticker_prices 
                WHERE ticker_symbol = ?
            '''
            params = [ticker_symbol]
            
            if start_date:
                query += ' AND date >= ?'
                params.append(start_date)
            
            if end_date:
                query += ' AND date <= ?'
                params.append(end_date)
            
            query += ' ORDER BY date'
            
            cursor.execute(query, params)
            result = cursor.fetchall()
            cursor.close()
            return result
        except sqlite3.Error as e:
            print(f"Error getting ticker prices: {e}")
            return []
    
    def get_price_stats(self, ticker_symbol: str) -> Optional[dict]:
        """Get price statistics for a ticker."""
        try:
            cursor = self.conn.cursor()
            cursor.execute('''
                SELECT 
                    COUNT(*) as record_count,
                    MIN(close_price) as min_price,
                    MAX(close_price) as max_price,
                    AVG(close_price) as avg_price,
                    MIN(date) as start_date,
                    MAX(date) as end_date
                FROM ticker_prices 
                WHERE ticker_symbol = ?
            ''', (ticker_symbol,))
            
            result = cursor.fetchone()
            cursor.close()
            if result:
                return {
                    'ticker_symbol': ticker_symbol,
                    'record_count': result[0],
                    'min_price': result[1],
                    'max_price': result[2],
                    'avg_price': result[3],
                    'start_date': result[4],
                    'end_date': result[5]
                }
            return None
        except sqlite3.Error as e:
            print(f"Error getting price stats: {e}")
            return None
    
    def get_all_tickers(self) -> List[Tuple]:
        """Get all available tickers."""
        try:
            cursor = self.conn.cursor()
            cursor.execute('SELECT ticker_id, ticker_symbol FROM tickers ORDER BY ticker_symbol')
            result = cursor.fetchall()
            cursor.close()
            return result
        except sqlite3.Error as e:
            print(f"Error getting all tickers: {e}")
            return []
    
    def get_database_stats(self) -> dict:
        """Get overall database statistics."""
        try:
            cursor = self.conn.cursor()
            
            # Count tickers
            cursor.execute('SELECT COUNT(*) FROM tickers')
            ticker_count = cursor.fetchone()[0]
            
            # Count price records
            cursor.execute('SELECT COUNT(*) FROM ticker_prices')
            price_count = cursor.fetchone()[0]
            
            # Get date range
            cursor.execute('SELECT MIN(date), MAX(date) FROM ticker_prices')
            date_range = cursor.fetchone()
            
            cursor.close()
            
            return {
                'ticker_count': ticker_count,
                'price_record_count': price_count,
                'date_range': {
                    'start': date_range[0],
                    'end': date_range[1]
                }
            }
        except sqlite3.Error as e:
            print(f"Error getting database stats: {e}")
            return {}
    
    def close(self):
        """Close the database connection."""
        if self.conn:
            self.conn.close()
            print("Database connection closed")

    def __del__(self):
        """Ensure database connection is closed when object is destroyed."""
        self.close() 