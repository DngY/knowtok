import os
from dotenv import load_dotenv
import logging

logger = logging.getLogger(__name__)
load_dotenv()

class Config:
    # Basic configs
    SECRET_KEY = os.getenv('FLASK_SECRET_KEY', 'dev')
    DEBUG = os.getenv('FLASK_DEBUG', 'True').lower() == 'true'
    
    # Database configs
    basedir = os.path.abspath(os.path.dirname(__file__))
    SQLALCHEMY_DATABASE_URI = f'sqlite:///{os.path.join(basedir, "knowtok.db")}'
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    
    # OpenAI configs
    USE_OPENAI = False
    OPENAI_API_KEY = os.getenv('OPENAI_API_KEY')
    OPENAI_BASE_URL = os.getenv('OPENAI_BASE_URL')
    
    # 开发模式配置
    USE_MOCK_DATA = os.getenv('USE_MOCK_DATA', 'True').lower() == 'true'
    MOCK_API_DELAY = float(os.getenv('MOCK_API_DELAY', '1.0'))  # 模拟API延迟时间(秒)

# Move logging after class definition
logger.info(f"Database URI: {Config.SQLALCHEMY_DATABASE_URI}")
logger.info(f"OpenAI Configuration - Enabled: {Config.USE_OPENAI}")
logger.debug(f"OpenAI API Key present: {bool(Config.OPENAI_API_KEY)}")
logger.debug(f"OpenAI Base URL: {Config.OPENAI_BASE_URL}")
