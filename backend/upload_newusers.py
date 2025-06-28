import os
import psycopg2
from dotenv import load_dotenv

# --- Configuration ---
# Load environment variables from a .env file.
# This is where your DATABASE_URL should be stored securely.
load_dotenv() 

DATABASE_URL = ""

# --- SQL Command to Create the Users Table ---
# This table stores all information about a user account.
# It must be created BEFORE the portfolios table.
CREATE_USERS_TABLE_COMMAND = """
CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(255) PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    username VARCHAR(255) UNIQUE NOT NULL,
    first_name VARCHAR(255) NOT NULL,
    last_name VARCHAR(255) NOT NULL,
    hashed_password VARCHAR(255) NOT NULL,
    avatar TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
"""

# --- SQL Command to Create the Portfolios Table ---
# This table stores every saved portfolio analysis. It includes a foreign key
# to link each portfolio to a user.
CREATE_PORTFOLIOS_TABLE_COMMAND = """
CREATE TABLE IF NOT EXISTS portfolios (
    id VARCHAR(255) PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    portfolio_amount REAL NOT NULL,
    lookback_period INTEGER NOT NULL,
    allocations JSONB NOT NULL,
    expected_value REAL NOT NULL,
    worst_case REAL NOT NULL,
    best_case REAL NOT NULL,
    expected_return REAL NOT NULL,
    prob_of_positive_return REAL NOT NULL,
    prob_of_return_greater_than_10 REAL NOT NULL,
    prob_of_return_greater_than_20 REAL NOT NULL,
    prob_of_loss_greater_than_10 REAL NOT NULL,
    prob_of_loss_greater_than_20 REAL NOT NULL,
    simulation_data JSONB
);
"""

def setup_database_tables():
    """
    Connects to the PostgreSQL database and creates the 'users' and 'portfolios' tables.
    """
    conn = None
    try:
        if not DATABASE_URL:
            print("Error: DATABASE_URL environment variable is not set.")
            return

        print("Connecting to the PostgreSQL database...")
        conn = psycopg2.connect(DATABASE_URL)
        cursor = conn.cursor()
        
        # --- Create Users Table First ---
        print("Executing command to create 'users' table...")
        cursor.execute(CREATE_USERS_TABLE_COMMAND)
        print("'users' table created successfully (or already existed).")

        # --- Create Portfolios Table Second ---
        # This depends on the 'users' table existing due to the foreign key.
        print("Executing command to create 'portfolios' table...")
        cursor.execute(CREATE_PORTFOLIOS_TABLE_COMMAND)
        print("'portfolios' table created successfully (or already existed).")
        
        # Commit all transactions
        conn.commit()
        print("\nDatabase setup complete!")
        
        cursor.close()

    except psycopg2.Error as e:
        print(f"\nDatabase error: {e}")
        if conn:
            conn.rollback()

    finally:
        if conn is not None:
            conn.close()
            print("Database connection closed.")

if __name__ == "__main__":
    setup_database_tables()
