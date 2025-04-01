from flask import Blueprint, render_template, jsonify, request
from app.services.wiki_service import get_random_articles
from app.services.openai_service import summarize_article
import logging

logger = logging.getLogger(__name__)
main_blueprint = Blueprint('main', __name__, template_folder='templates')

@main_blueprint.route('/')
def index():
    return render_template('index.html')

@main_blueprint.route('/api/articles')
def get_articles():
    try:
        language = request.args.get('lang', 'en')
        logger.debug(f"Fetching articles for language: {language}")
        print(f"Requesting articles in language: {language}")  # 添加调试信息
        
        articles = get_random_articles(language)
        print(f"Retrieved {len(articles)} articles")  # 添加调试信息
        
        if not articles:
            logger.warning("No articles returned from wiki service")
            print("No articles found")  # 添加调试信息
            return jsonify({
                "error": "No articles found",
                "message": "Please try again"
            }), 404
            
        logger.info(f"Successfully retrieved {len(articles)} articles")
        return jsonify(articles)
        
    except Exception as e:
        logger.error(f"Error in get_articles: {e}")
        print(f"Error in get_articles: {str(e)}")  # 添加调试信息
        return jsonify({
            "error": "Server error",
            "message": str(e)
        }), 500
