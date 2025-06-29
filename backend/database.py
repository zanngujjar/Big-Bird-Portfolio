import os
import psycopg2
import psycopg2.extras
import uuid
import json
from typing import List, Tuple, Optional, Dict, List

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
            return self.conn.cursor(cursor_factory=psycopg2.extras.DictCursor)
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
                if result and result['record_count'] > 0:
                    return dict(result)
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
    # --- NEW USER METHODS ---

    def create_user(self, email, username, first_name, last_name, hashed_password):
        user_id = str(uuid.uuid4())
        try:
            with self._get_cursor() as cursor:
                cursor.execute("""
                    INSERT INTO users (id, email, username, first_name, last_name, hashed_password)
                    VALUES (%s, %s, %s, %s, %s, %s)
                    RETURNING id, email, username, first_name, last_name, created_at;
                """, (user_id, email, username, first_name, last_name, hashed_password))
                new_user = cursor.fetchone()
                self.conn.commit()
                # No need for dict() conversion, new_user is already a DictRow
                return new_user
        except psycopg2.Error as e:
            self.conn.rollback()
            raise e

    def find_user_by_email(self, email: str) -> Optional[Dict]:
        """Finds a user by email. Correctly returns a Dict or None."""
        try:
            with self._get_cursor() as cursor:
                cursor.execute("SELECT * FROM users WHERE email = %s", (email,))
                user = cursor.fetchone()
                # No need for dict() conversion, user is already a DictRow
                return user
        except Exception as e:
            print(f"Error finding user by email: {e}")
            return None

    def find_user_by_id(self, user_id: str) -> Optional[Dict]:
        """Finds a user by their unique ID. Correctly returns a Dict or None."""
        try:
            with self._get_cursor() as cursor:
                cursor.execute("SELECT * FROM users WHERE id = %s", (user_id,))
                user = cursor.fetchone()
                # No need for dict() conversion
                return user
        except Exception as e:
            print(f"Error finding user by id: {e}")
            return None

    def check_if_user_exists(self, email: str, username: str) -> Optional[str]:
        try:
            with self._get_cursor() as cursor:
                cursor.execute("""
                    SELECT 
                        CASE WHEN email = %s THEN 'email' ELSE 'username' END as existing_field
                    FROM users 
                    WHERE email = %s OR username = %s
                    LIMIT 1;
                """, (email, username, email, username))
                result = cursor.fetchone()
                return result['existing_field'] if result else None
        except Exception as e:
            print(f"Error checking user existence: {e}")
            return None

    # --- PORTFOLIO METHODS ---
    def save_portfolio(self, user_id, portfolio_data):
        portfolio_id = str(uuid.uuid4())
        try:
            with self._get_cursor() as cursor:
                cursor.execute("""
                    INSERT INTO portfolios (
                        id, user_id, name, description, portfolio_amount, lookback_period, 
                        allocations, expected_value, worst_case, best_case, expected_return,
                        prob_of_positive_return, prob_of_return_greater_than_10, prob_of_return_greater_than_20,
                        prob_of_loss_greater_than_10, prob_of_loss_greater_than_20, simulation_data
                    ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s) RETURNING id;
                """, (
                    portfolio_id, user_id, portfolio_data['name'], portfolio_data.get('description'), 
                    portfolio_data['portfolioAmount'], portfolio_data['lookbackPeriod'],
                    json.dumps(portfolio_data['allocations']), 
                    portfolio_data['results']['expectedValue'], portfolio_data['results']['worstCase'],
                    portfolio_data['results']['bestCase'], portfolio_data['results']['expectedReturn'],
                    portfolio_data['results']['probOfPositiveReturn'], portfolio_data['results']['probOfReturnGreaterThan10'],
                    portfolio_data['results']['probOfReturnGreaterThan20'], portfolio_data['results']['probOfLossGreaterThan10'],
                    portfolio_data['results']['probOfLossGreaterThan20'], 
                    json.dumps(portfolio_data.get('simulationData'))
                ))
                result = cursor.fetchone()
                self.conn.commit()
                return result['id'] if result else None
        except psycopg2.Error as e:
            self.conn.rollback()
            raise e
    def delete_portfolio(self, portfolio_id: str, user_id: str) -> bool:
        """Deletes a portfolio, ensuring it belongs to the correct user."""
        try:
            with self._get_cursor() as cursor:
                # The WHERE clause ensures a user can only delete their own portfolio.
                cursor.execute("""
                    DELETE FROM portfolios
                    WHERE id = %s AND user_id = %s
                """, (portfolio_id, user_id))
                
                # cursor.rowcount will be 1 if a row was deleted, 0 otherwise.
                deleted_rows = cursor.rowcount
                self.conn.commit()
                return deleted_rows > 0
        except psycopg2.Error as e:
            self.conn.rollback()
            print(f"Database error deleting portfolio: {e}")
            raise e

    def get_portfolios_for_user(self, user_id):
        try:
            with self._get_cursor() as cursor:
                cursor.execute("SELECT * FROM portfolios WHERE user_id = %s ORDER BY created_at DESC", (user_id,))
                portfolios = cursor.fetchall()
                # No need for dict() conversion, it's already a list of DictRows
                return portfolios if portfolios else []
        except Exception as e:
            print(f"Error getting portfolios for user {user_id}: {e}")
            return []

    def get_portfolio_by_id(self, portfolio_id: str, user_id: str) -> Optional[Dict]:
        """Fetches a single portfolio by its ID, ensuring it belongs to the user."""
        try:
            with self._get_cursor() as cursor:
                cursor.execute(
                    "SELECT * FROM portfolios WHERE id = %s AND user_id = %s",
                    (portfolio_id, user_id)
                )
                portfolio = cursor.fetchone()
                return portfolio
        except Exception as e:
            print(f"Error getting portfolio {portfolio_id} for user {user_id}: {e}")
            return None
            

    # It's crucial to remove or comment out the __del__ method.
    # Python's garbage collection timing is unpredictable, and __del__
    # can cause connections to close unexpectedly, leading to "cursor already closed" errors.
    # Instead, rely on explicit `close()` calls during application shutdown.
    # def __del__(self):
    #     self.close()