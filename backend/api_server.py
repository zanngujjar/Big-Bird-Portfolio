from flask import Flask, jsonify, request
from flask_cors import CORS
from flask_bcrypt import Bcrypt
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity, JWTManager
from database import BigBird_portfolio_database
import json
import os   
import psycopg2

app = Flask(__name__)
frontend_url = "https://bigbirdportfolios.com" 

# 2. Configure CORS to only allow requests for API endpoints
#    and only from your specific frontend URL.
CORS(app, resources={r"/api/*": {"origins": frontend_url}})

# Initialize database connection
db = BigBird_portfolio_database()

# Secret key for JWT. In production, use a strong, randomly generated key stored in an environment variable.
app.config["JWT_SECRET_KEY"] = os.getenv("JWT_SECRET_KEY") 

if not app.config["JWT_SECRET_KEY"]:
    raise RuntimeError("JWT_SECRET_KEY environment variable is not set")

# --- Initializations ---
bcrypt = Bcrypt(app)
jwt = JWTManager(app)


# --- NEW AUTHENTICATION ENDPOINTS ---

@app.route('/api/auth/signup', methods=['POST'])
def signup():
    """Endpoint for user registration."""
    data = request.get_json()
    email = data.get('email')
    username = data.get('username')
    first_name = data.get('firstName')
    last_name = data.get('lastName')
    password = data.get('password')

    existing_field = db.check_if_user_exists(email, username)
    
    # Check the result and return the specific error
    if existing_field == 'email':
        return jsonify({'success': False, 'error': 'Email already registered'}), 409
    if existing_field == 'username':
        return jsonify({'success': False, 'error': 'Username is already taken'}), 409
    # --- END OF UPDATE ---
    hashed_password = bcrypt.generate_password_hash(password).decode('utf-8')

    try:
        new_user = db.create_user(email, username, first_name, last_name, hashed_password)
        if not new_user:
            return jsonify({'success': False, 'error': 'Failed to create user account.'}), 500

        # --- THIS IS THE NEW LOGIC ---
        # After creating the user, immediately create an access token for them.
        access_token = create_access_token(identity=new_user['id'])
        
        # Prepare the user data to send back, excluding the password hash.
        user_data = {key: new_user[key] for key in new_user.keys() if key != 'hashed_password'}
        
        # Return the user data AND the new access token.
        return jsonify({
            'success': True, 
            'access_token': access_token,
            'user': user_data
        }), 201
    except psycopg2.IntegrityError as e:
        # This error is raised when a unique constraint (like for email or username) is violated.
        return jsonify({'success': False, 'error': 'This email or username is already taken.'}), 409
    except Exception as e:
        return jsonify({'success': False, 'error': 'An internal error occurred during signup.'}), 500

@app.route('/api/auth/login', methods=['POST'])
def login():
    """Endpoint for user login."""
    data = request.get_json()
    email = data.get('email')
    password = data.get('password')

    if not email or not password:
        return jsonify({'success': False, 'error': 'Email and password are required'}), 400

    user = db.find_user_by_email(email)
    if user and bcrypt.check_password_hash(user['hashed_password'], password):
        # Create a JWT token. The 'identity' is the user's ID, which we'll use to identify them in protected routes.
        access_token = create_access_token(identity=user['id'])
        # Prepare user data to send back, excluding the password
        user_data = {key: user[key] for key in user.keys() if key != 'hashed_password'}
        
        return jsonify({
            'success': True, 
            'access_token': access_token,
            'user': user_data
        })
    else:
        return jsonify({'success': False, 'error': 'Invalid credentials'}), 401
    

#--- NEW AUTHENTICATION ENDPOINTS ---
@app.route('/api/auth/me', methods=['GET'])
@jwt_required() # Protect this route
def get_current_user():
    """Gets the profile of the currently logged-in user."""
    current_user_id = get_jwt_identity()
    user = db.find_user_by_id(current_user_id)
    
    if not user:
        return jsonify({"success": False, "error": "User not found"}), 404

    # Return user data, making sure to exclude the password hash
    user_data = {key: user[key] for key in user.keys() if key != 'hashed_password'}
    
    return jsonify({"success": True, "user": user_data})


# --- NEW PORTFOLIO ENDPOINTS ---

@app.route('/api/portfolios', methods=['POST'])
@jwt_required() # This decorator protects the route, requiring a valid JWT
def save_new_portfolio():
    """Saves a portfolio for the currently authenticated user."""
    current_user_id = get_jwt_identity() # Get the user ID from the JWT token
    portfolio_data = request.get_json()

    if not portfolio_data:
        return jsonify({'success': False, 'error': 'No portfolio data provided'}), 400

    try:
        portfolio_id = db.save_portfolio(current_user_id, portfolio_data)
        if portfolio_id:
            return jsonify({'success': True, 'portfolio_id': portfolio_id}), 201
        else:
            return jsonify({'success': False, 'error': 'Failed to save portfolio'}), 500
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/portfolios', methods=['GET'])
@jwt_required()
def get_user_portfolios():
    current_user_id = get_jwt_identity()
    try:
        portfolios_from_db = db.get_portfolios_for_user(current_user_id)
        
        # --- THIS IS THE FIX FOR DATA CORRUPTION ---
        results = []
        for p_row in portfolios_from_db:
            # 1. Convert the special database row object to a standard Python dictionary.
            portfolio_dict = dict(p_row)
            
            # 2. Check if the 'allocations' key exists and is a string, then parse it.
            if 'allocations' in portfolio_dict and isinstance(portfolio_dict['allocations'], str):
                portfolio_dict['allocations'] = json.loads(portfolio_dict['allocations'])
            
            # 3. Do the same for 'simulation_data' if it exists.
            if 'simulation_data' in portfolio_dict and isinstance(portfolio_dict['simulation_data'], str):
                portfolio_dict['simulation_data'] = json.loads(portfolio_dict['simulation_data'])

            # 4. Format the datetime object to a standardized string.
            if portfolio_dict.get('created_at'):
                portfolio_dict['created_at'] = portfolio_dict['created_at'].isoformat()
            
            results.append(portfolio_dict)
        
        return jsonify({'success': True, 'data': results})
        # --- END OF FIX ---

    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500
        

@app.route('/api/portfolios/<string:portfolio_id>', methods=['GET'])
@jwt_required()
def get_portfolio_by_id(portfolio_id):
    """Fetches a single portfolio by its ID."""
    current_user_id = get_jwt_identity()
    try:
        portfolio = db.get_portfolio_by_id(portfolio_id, current_user_id)
        if portfolio:
            # Convert the row to a dict and handle JSON and date fields
            portfolio_dict = dict(portfolio)
            if 'allocations' in portfolio_dict and isinstance(portfolio_dict['allocations'], str):
                portfolio_dict['allocations'] = json.loads(portfolio_dict['allocations'])
            if 'simulation_data' in portfolio_dict and isinstance(portfolio_dict['simulation_data'], str):
                portfolio_dict['simulation_data'] = json.loads(portfolio_dict['simulation_data'])
            if portfolio_dict.get('created_at'):
                portfolio_dict['created_at'] = portfolio_dict['created_at'].isoformat()
            
            return jsonify({'success': True, 'data': portfolio_dict})
        else:
            return jsonify({'success': False, 'error': 'Portfolio not found or permission denied'}), 404
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/portfolios/<string:portfolio_id>', methods=['DELETE'])
@jwt_required()
def delete_portfolio_by_id(portfolio_id):
    current_user_id = get_jwt_identity()
    try:
        success = db.delete_portfolio(portfolio_id, current_user_id)
        if success:
            return jsonify({'success': True, 'message': 'Portfolio deleted successfully'}), 200
        else:
            return jsonify({'success': False, 'error': 'Portfolio not found or you do not have permission to delete it'}), 404
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500



@app.route('/api/health', methods=['GET'])
def health_check():
    """Health check endpoint."""
    return jsonify({
        'status': 'healthy',
        'message': 'Ticker Database API is running'
    })

@app.route('/api/stats', methods=['GET'])
def get_database_stats():
    """Get overall database statistics."""
    try:
        stats = db.get_database_stats()
        return jsonify({
            'success': True,
            'data': stats
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/tickers', methods=['GET'])
def get_all_tickers():
    """Get all available tickers."""
    try:
        tickers = db.get_all_tickers()
        ticker_list = [{'ticker_id': t[0], 'ticker_symbol': t[1]} for t in tickers]
        return jsonify({
            'success': True,
            'data': ticker_list,
            'count': len(ticker_list)
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/ticker/<symbol>', methods=['GET'])
def get_ticker_info(symbol):
    """Get ticker information by symbol."""
    try:
        ticker_info = db.get_ticker_info(symbol.upper())
        if ticker_info:
            return jsonify({
                'success': True,
                'data': {
                    'ticker_id': ticker_info[0],
                    'ticker_symbol': ticker_info[1]
                }
            })
        else:
            return jsonify({
                'success': False,
                'error': f'Ticker {symbol} not found'
            }), 404
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/ticker/<symbol>/prices', methods=['GET'])
def get_ticker_prices(symbol):
    """Get price data for a specific ticker."""
    try:
        start_date = request.args.get('start_date')
        end_date = request.args.get('end_date')
        limit = request.args.get('limit', type=int)
        
        # Call the database method which now returns (date, close_price) tuples
        prices = db.get_ticker_prices(symbol.upper(), start_date, end_date)
        
        # Apply limit if specified
        if limit and limit > 0:
            prices = prices[-limit:]  # Get most recent prices
        
        # --- THIS IS THE CRITICAL FIX ---
        # Adjust mapping to expect only 2 elements (date, close_price) from each tuple
        price_list = [
            {
                'date': str(p[0]),         # p[0] is the date
                'close_price': float(p[1]) # p[1] is the close_price
                # Removed 'ticker_id' and 'ticker_symbol' as they are no longer returned by database.py
            } for p in prices
        ]
        
        return jsonify({
            'success': True,
            'data': price_list,
            'count': len(price_list)
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/ticker/<symbol>/stats', methods=['GET'])
def get_ticker_stats(symbol):
    """Get price statistics for a ticker."""
    try:
        stats = db.get_price_stats(symbol.upper())
        if stats:
            return jsonify({
                'success': True,
                'data': stats
            })
        else:
            return jsonify({
                'success': False,
                'error': f'No price data found for ticker {symbol}'
            }), 404
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/search/tickers', methods=['GET'])
def search_tickers():
    """Search tickers by symbol pattern."""
    try:
        query = request.args.get('q', '').upper()
        if not query:
            return jsonify({
                'success': False,
                'error': 'Query parameter "q" is required'
            }), 400
        
        all_tickers = db.get_all_tickers()
        matching_tickers = [
            {'ticker_id': t[0], 'ticker_symbol': t[1]} 
            for t in all_tickers 
            if query in t[1]
        ]
        
        return jsonify({
            'success': True,
            'data': matching_tickers,
            'count': len(matching_tickers)
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.errorhandler(404)
def not_found(error):
    return jsonify({
        'success': False,
        'error': 'Endpoint not found'
    }), 404

@app.errorhandler(500)
def internal_error(error):
    return jsonify({
        'success': False,
        'error': 'Internal server error'
    }), 500

if __name__ == '__main__':
    print("Starting Ticker Database API Server...")
    print("Available endpoints:")
    print("  GET /api/health - Health check")
    print("  GET /api/stats - Database statistics")
    print("  GET /api/tickers - All tickers")
    print("  GET /api/ticker/<symbol> - Ticker info")
    print("  GET /api/ticker/<symbol>/prices - Ticker prices")
    print("  GET /api/ticker/<symbol>/stats - Ticker statistics")
    print("  GET /api/search/tickers?q=<query> - Search tickers")
    
    app.run(debug=True, host='0.0.0.0', port=5000) 