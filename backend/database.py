import os
import psycopg2
import psycopg2.extras
from typing import List, Tuple, Optional

class BigBird_portfolio_database:
    def __init__(self, db_url: str = os.getenv("DATABASE_URL")):
        """
        Initializes connection to the PostgreSQL database.
        It expects the database URL to be provided, preferably via an environment variable.
        """
        if not db_url:
            # If db_url is empty, it means the DATABASE_URL environment variable was not set.
            # This is a critical error and the application cannot proceed.
            raise ValueError("DATABASE_URL environment variable not set. Cannot connect to PostgreSQL.")
        
        self.db_url = db_url
        self.conn = None # Initialize connection object to None
        self.connect() # Attempt to establish the initial database connection

    def connect(self):
        """
        Establishes a connection to the PostgreSQL database.
        If an existing connection is found, it attempts to close it first
        to ensure a fresh connection, which is useful for re-connection logic.
        """
        # If a connection already exists and is not closed, attempt to close it gracefully.
        # This prevents resource leaks if `connect` is called when a connection is already open.
        if self.conn and not self.conn.closed:
            try:
                self.conn.close()
                print("Closed existing database connection before re-establishing.")
            except Exception as e:
                print(f"Warning: Error closing existing connection: {e}")
        
        # Reset connection to None before attempting to create a new one.
        self.conn = None 
        
        try:
            # Establish the new connection using the provided database URL.
            # psycopg2 automatically handles basic connection state, but a robust app
            # might implement connection pooling (e.g., using psycopg2.pool) for high concurrency.
            self.conn = psycopg2.connect(self.db_url)
            print(f"Successfully connected to PostgreSQL database: {self.db_url}")
        except Exception as e:
            # If connection fails, log the error and re-raise it.
            # Re-raising ensures the calling application (e.g., Flask) knows about the failure.
            print(f"Error connecting to PostgreSQL database: {e}")
            raise e

    def _get_cursor(self):
        """
        Internal helper method to obtain a database cursor.
        It includes logic to attempt to re-establish the connection if it's found to be closed or stale.
        This makes individual query methods more resilient to connection drops.
        """
        try:
            # Check if the connection is None or has been closed by the database server (e.g., idle timeout).
            if self.conn is None or self.conn.closed:
                print("Database connection is closed or None. Attempting to re-establish connection...")
                self.connect() # Reconnect if the connection is no longer active.
                
            # Return a new cursor from the active connection.
            # Using `with self._get_cursor() as cursor:` ensures the cursor is closed automatically.
            return self.conn.cursor()
        except Exception as e:
            # If an error occurs during cursor creation or reconnection, log and re-raise.
            print(f"Critical error: Could not obtain database cursor or re-establish connection: {e}")
            raise # Propagate the exception up the call stack.

    def get_ticker_info(self, ticker_symbol: str) -> Optional[Tuple]:
        """
        Retrieves information for a single ticker by its symbol.
        
        Args:
            ticker_symbol (str): The symbol of the ticker to retrieve (e.g., 'AAPL').
            
        Returns:
            Optional[Tuple]: A tuple containing (ticker_id, ticker_symbol) if found, otherwise None.
        """
        try:
            with self._get_cursor() as cursor: # Use the robust helper to get a cursor
                cursor.execute('''
                    SELECT ticker_id, ticker_symbol FROM tickers 
                    WHERE ticker_symbol = %s -- PostgreSQL uses %s for parameter placeholders
                ''', (ticker_symbol,))
                result = cursor.fetchone() # Fetch a single row
                return result
        except Exception as e:
            print(f"Error getting ticker info for {ticker_symbol}: {e}")
            return None
    
    def get_ticker_prices(self, ticker_symbol: str, start_date: str = None, end_date: str = None) -> List[Tuple]:
        """
        Retrieves historical close prices for a specific ticker within an optional date range.
        
        Args:
            ticker_symbol (str): The symbol of the ticker (e.g., 'AAPL').
            start_date (str, optional): The start date in 'YYYY-MM-DD' format.
            end_date (str, optional): The end date in 'YYYY-MM-DD' format.
            
        Returns:
            List[Tuple]: A list of tuples, each containing (date, close_price).
        """
        try:
            with self._get_cursor() as cursor: # Use the robust helper to get a cursor
                query = '''
                    SELECT date, close_price -- Only select the necessary columns for prices
                    FROM ticker_prices
                    WHERE ticker_symbol = %s 
                '''
                params = [ticker_symbol] # Start with the ticker symbol parameter
                
                # Conditionally add date filters to the query and parameters
                if start_date:
                    query += ' AND date >= %s'
                    params.append(start_date)
                
                if end_date:
                    query += ' AND date <= %s'
                    params.append(end_date)
                
                query += ' ORDER BY date ASC' # Ensure results are ordered chronologically by date
                
                cursor.execute(query, params) # Execute the query with the prepared parameters
                result = cursor.fetchall() # Fetch all matching rows
                return result
        except Exception as e:
            print(f"Error getting ticker prices for {ticker_symbol}: {e}")
            return []
    
    def get_price_stats(self, ticker_symbol: str) -> Optional[dict]:
        """
        Retrieves aggregate statistics (count, min, max, avg price, date range) for a ticker's prices.
        
        Args:
            ticker_symbol (str): The symbol of the ticker (e.g., 'AAPL').
            
        Returns:
            Optional[dict]: A dictionary containing price statistics if data exists, otherwise None.
        """
        try:
            with self._get_cursor() as cursor: # Use the robust helper to get a cursor
                cursor.execute('''
                    SELECT 
                        COUNT(*) as record_count,
                        MIN(close_price) as min_price,
                        MAX(close_price) as max_price,
                        AVG(close_price) as avg_price,
                        MIN(date) as start_date,
                        MAX(date) as end_date
                    FROM ticker_prices 
                    WHERE ticker_symbol = %s 
                ''', (ticker_symbol,))
                
                result = cursor.fetchone() # Fetch a single row of aggregate results
                if result and result[0] > 0: # Check if any records were found (count > 0)
                    # Convert date objects to string format for JSON serialization
                    return {
                        'ticker_symbol': ticker_symbol,
                        'record_count': result[0],
                        'min_price': result[1],
                        'max_price': result[2],
                        'avg_price': result[3],
                        'start_date': str(result[4]) if result[4] else None,
                        'end_date': str(result[5]) if result[5] else None
                    }
                return None # Return None if no price data is found for the ticker
        except Exception as e:
            print(f"Error getting price stats for {ticker_symbol}: {e}")
            return None
    
    def get_all_tickers(self) -> List[Tuple]:
        """
        Retrieves all available ticker symbols from the database.
        
        Returns:
            List[Tuple]: A list of tuples, each containing (ticker_id, ticker_symbol).
        """
        try:
            with self._get_cursor() as cursor: # Use the robust helper to get a cursor
                cursor.execute('SELECT ticker_id, ticker_symbol FROM tickers ORDER BY ticker_symbol')
                result = cursor.fetchall() # Fetch all ticker rows
                return result
        except Exception as e:
            print(f"Error getting all tickers: {e}")
            return []
    
    def get_database_stats(self) -> dict:
        """
        Retrieves overall statistics about the database, including ticker count,
        price record count, and the overall date range of price data.
        
        Returns:
            dict: A dictionary containing database statistics.
        """
        try:
            with self._get_cursor() as cursor: # Use the robust helper to get a cursor
                
                # Count the total number of unique tickers
                cursor.execute('SELECT COUNT(*) FROM tickers')
                ticker_count = cursor.fetchone()[0]
                
                # Count the total number of price records
                cursor.execute('SELECT COUNT(*) FROM ticker_prices')
                price_count = cursor.fetchone()[0]
                
                # Get the earliest and latest dates from the ticker_prices table
                cursor.execute('SELECT MIN(date), MAX(date) FROM ticker_prices')
                date_range = cursor.fetchone()
                
                # Return the statistics in a dictionary, converting dates to strings.
                return {
                    'ticker_count': ticker_count,
                    'price_record_count': price_count,
                    'date_range': {
                        'start': str(date_range[0]) if date_range[0] else None,
                        'end': str(date_range[1]) if date_range[1] else None
                    }
                }
        except Exception as e:
            print(f"Error getting database stats: {e}")
            return {}
    
    def close(self):
        """
        Closes the database connection if it is currently open.
        This should be called explicitly when the application is shutting down.
        """
        if self.conn and not self.conn.closed: # Only attempt to close if connection exists and is not already closed
            try:
                self.conn.close() # Close the psycopg2 connection
                self.conn = None # Set connection to None to indicate it's closed
                print("PostgreSQL database connection closed successfully.")
            except Exception as e:
                # Log any errors that occur during connection closure.
                print(f"Error closing PostgreSQL database connection: {e}")

    # It's crucial to remove or comment out the __del__ method.
    # Python's garbage collection timing is unpredictable, and __del__
    # can cause connections to close unexpectedly, leading to "cursor already closed" errors.
    # Instead, rely on explicit `close()` calls during application shutdown.
    # def __del__(self):
    #     self.close()