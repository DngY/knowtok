from flask import Blueprint, request, jsonify, session
from app.models.user import User, db
import logging

logger = logging.getLogger(__name__)
auth_blueprint = Blueprint('auth', __name__)

@auth_blueprint.route('/api/auth/register', methods=['POST'])
def register():
    try:
        data = request.json
        username = data.get('username')
        password = data.get('password')
        email = data.get('email')
        phone = data.get('phone')
        
        if not username or not password or (not email and not phone):
            return jsonify({'error': 'Missing required fields'}), 400
            
        if email and not User.is_valid_email(email):
            return jsonify({'error': 'Invalid email format'}), 400
            
        if phone and not User.is_valid_phone(phone):
            return jsonify({'error': 'Invalid phone format'}), 400
            
        user = User(username=username, email=email, phone=phone)
        user.set_password(password)
        
        db.session.add(user)
        db.session.commit()
        
        return jsonify({'message': 'Registration successful'}), 201
        
    except Exception as e:
        logger.error(f"Registration error: {str(e)}")
        return jsonify({'error': 'Registration failed'}), 500

@auth_blueprint.route('/api/auth/login', methods=['POST'])
def login():
    try:
        data = request.json
        identifier = data.get('identifier')  # email or phone
        password = data.get('password')
        
        if not identifier or not password:
            return jsonify({'error': 'Missing credentials'}), 400
            
        user = User.query.filter(
            (User.email == identifier) | (User.phone == identifier)
        ).first()
        
        if user and user.check_password(password):
            session['user_id'] = user.id
            return jsonify({'message': 'Login successful'}), 200
        
        return jsonify({'error': 'Invalid credentials'}), 401
        
    except Exception as e:
        logger.error(f"Login error: {str(e)}")
        return jsonify({'error': 'Login failed'}), 500

@auth_blueprint.route('/api/auth/logout')
def logout():
    session.pop('user_id', None)
    return jsonify({'message': 'Logout successful'}), 200

@auth_blueprint.route('/api/auth/check', methods=['GET'])
def check_auth():
    """检查用户登录状态"""
    user_id = session.get('user_id')
    if user_id:
        user = User.query.get(user_id)
        if user:
            return jsonify({
                'isAuthenticated': True,
                'user': {
                    'id': user.id,
                    'username': user.username,
                    'email': user.email
                }
            })
    # 修改：返回200状态码而不是401，因为未登录是正常状态
    return jsonify({
        'isAuthenticated': False,
        'message': 'Not logged in'
    }), 200

@auth_blueprint.route('/api/auth/status', methods=['GET'])
def auth_status():
    """检查用户登录状态"""
    user_id = session.get('user_id')
    if user_id:
        user = User.query.get(user_id)
        if user:
            return jsonify({
                'isAuthenticated': True,
                'user': {
                    'id': user.id,
                    'username': user.username
                }
            })
    return jsonify({
        'isAuthenticated': False
    })
