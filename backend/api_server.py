from flask import Flask, jsonify, request
from flask_cors import CORS
from database import BigBird_portfolio_database
import json

app = Flask(__name__)
CORS(app)  # Enable CORS for frontend integration

# Initialize database connection
db = BigBird_portfolio_database()

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
        
        prices = db.get_ticker_prices(symbol.upper(), start_date, end_date)
        
        # Apply limit if specified
        if limit and limit > 0:
            prices = prices[-limit:]  # Get most recent prices
        
        price_list = [
            {
                'ticker_id': p[0],
                'ticker_symbol': p[1],
                'date': p[2],
                'close_price': p[3]
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