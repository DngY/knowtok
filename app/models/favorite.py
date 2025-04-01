from . import db
from datetime import datetime

class Favorite(db.Model):
    __tablename__ = 'favorites'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    article_id = db.Column(db.String(100), nullable=False)
    title = db.Column(db.String(200))
    extract = db.Column(db.Text)
    url = db.Column(db.String(500))
    thumbnail = db.Column(db.String(500))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # 添加唯一约束确保用户不会重复收藏同一文章
    __table_args__ = (db.UniqueConstraint('user_id', 'article_id', name='_user_article_uc'),)
