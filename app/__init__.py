from flask import Flask
from .config import setup_logging
from app.models.user import db
import logging
from config import Config

def create_app():
    setup_logging()
    logger = logging.getLogger(__name__)
    
    app = Flask(__name__)
    
    try:
        # 直接从Config类加载所有配置
        app.config.from_object(Config)
        logger.info(f"Database URI: {app.config['SQLALCHEMY_DATABASE_URI']}")
        
        # 初始化数据库
        db.init_app(app)
        
        # Register blueprints - 更改导入顺序和错误处理
        try:
            from .routes.main import main_blueprint
            from .routes.auth import auth_blueprint
            from .routes.favorites import favorites_blueprint
            
            app.register_blueprint(main_blueprint)
            app.register_blueprint(auth_blueprint)
            app.register_blueprint(favorites_blueprint)
            logger.info("Blueprints registered successfully")
        except ImportError as e:
            logger.error(f"Error importing blueprints: {e}")
            raise
        
        # 创建数据库表
        with app.app_context():
            db.create_all()
            logger.info("Database tables created successfully")
            
    except Exception as e:
        logger.error(f"Error during app initialization: {e}")
        raise
    
    return app