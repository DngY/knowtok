from flask import Blueprint, request, jsonify, session
from app.models import db, Favorite
import logging

logger = logging.getLogger(__name__)
favorites_blueprint = Blueprint('favorites', __name__)

@favorites_blueprint.route('/api/likes', methods=['GET'])
def get_likes():
    """获取用户的收藏列表"""
    user_id = session.get('user_id')
    if not user_id:
        return jsonify({'error': 'Unauthorized'}), 401
        
    try:
        # 修改：使用带有日志的查询
        logger.info(f"Fetching favorites for user_id: {user_id}")
        favorites = Favorite.query.filter_by(user_id=user_id).all()
        logger.info(f"Found {len(favorites)} favorites")
        
        # 修改：将数据模型转换为JSON
        result = [{
            'id': fav.article_id,
            'title': fav.title,
            'extract': fav.extract,
            'url': fav.url,
            'thumbnail': fav.thumbnail,
            'isLiked': True
        } for fav in favorites]
        
        logger.info(f"Returning favorites data: {result}")
        return jsonify(result)
    except Exception as e:
        logger.error(f"Error getting favorites: {str(e)}")
        return jsonify({'error': 'Failed to get favorites'}), 500

@favorites_blueprint.route('/api/likes', methods=['POST'])
def toggle_like():
    """切换文章的收藏状态"""
    user_id = session.get('user_id')
    if not user_id:
        return jsonify({'error': 'Unauthorized'}), 401
        
    try:
        data = request.json
        if not data or not data.get('id'):
            return jsonify({'error': 'Missing article ID'}), 400

        article_id = str(data.get('id'))  # 确保ID是字符串类型
        logger.info(f"Toggling like for user {user_id}, article {article_id}")
        
        # 查找现有收藏
        favorite = Favorite.query.filter_by(
            user_id=user_id,
            article_id=article_id
        ).first()
        
        if favorite:
            # 取消收藏
            logger.info(f"Removing favorite: {favorite.id}")
            db.session.delete(favorite)
            db.session.commit()
            return jsonify({
                'status': 'success',
                'isLiked': False,
                'message': 'Article removed from favorites'
            })
        else:
            # 添加收藏
            new_favorite = Favorite(
                user_id=user_id,
                article_id=article_id,
                title=data.get('title', ''),
                extract=data.get('extract', ''),
                url=data.get('url', ''),
                thumbnail=data.get('thumbnail', '')
            )
            logger.info(f"Adding new favorite: {new_favorite.__dict__}")
            db.session.add(new_favorite)
            db.session.commit()
            return jsonify({
                'status': 'success',
                'isLiked': True,
                'message': 'Article added to favorites'
            })
            
    except Exception as e:
        logger.error(f"Error toggling favorite: {str(e)}")
        db.session.rollback()
        return jsonify({'error': 'Failed to update favorites'}), 500
