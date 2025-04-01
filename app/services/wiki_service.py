import requests
from typing import List, Dict
import logging
from config import Config
from .openai_service import summarize_article
import random
import time
from .mock_data import MOCK_ARTICLES, ENGLISH_TITLES, ENGLISH_EXTRACTS

logger = logging.getLogger(__name__)

def get_mock_articles(language: str = 'en', count: int = 5) -> List[Dict]:
    """返回模拟的文章数据"""
    try:
        time.sleep(Config.MOCK_API_DELAY)
        selected_articles = random.sample(MOCK_ARTICLES, min(count, len(MOCK_ARTICLES)))
        
        if language == 'zh':
            return selected_articles
        else:
            return [{
                'id': article['id'],
                'title': ENGLISH_TITLES.get(article['id'], 'Unknown Title'),
                'extract': ENGLISH_EXTRACTS.get(article['id'], 'No content available'),
                'url': article['url'],
                'thumbnail': article['thumbnail']
            } for article in selected_articles]
            
    except Exception as e:
        logger.error(f"Error in get_mock_articles: {e}")
        return []

def get_random_articles(language: str = 'en', count: int = 5) -> List[Dict]:
    """根据配置返回真实或模拟的文章数据"""
    try:
        if Config.USE_MOCK_DATA:
            logger.info("Using mock data for articles")
            return get_mock_articles(language, count)
        logger.info("Using real Wikipedia API")
        return get_wikipedia_articles(language, count)
    except Exception as e:
        logger.error(f"Error in get_random_articles: {e}")
        return []

def get_wikipedia_articles(language: str = 'en', count: int = 5) -> List[Dict]:
    """原有的维基百科API调用函数"""
    base_url = f"https://{language}.wikipedia.org/w/api.php"
    params = {
        "action": "query",
        "format": "json",
        "list": "random",
        "rnlimit": str(count),
        "rnnamespace": "0",
        "prop": "extracts|info",
        "exintro": "1",
        "explaintext": "1"
    }
    
    try:
        response = requests.get(
            base_url, 
            params=params,
            headers={'User-Agent': 'KnowTok/1.0'},
            timeout=10,
            verify=True
        )
        
        if response.status_code != 200:
            logger.error(f"Error response: {response.text}")
            return []
            
        data = response.json()
        
        articles = []
        if 'query' in data and 'random' in data['query']:
            for page in data['query']['random']:
                article_params = {
                    "action": "query",
                    "format": "json",
                    "pageids": str(page['id']),
                    "prop": "extracts|info|pageimages",
                    "exintro": "1",
                    "explaintext": "1",
                    "inprop": "url",
                    "piprop": "thumbnail",
                    "pithumbsize": "400"
                }
                
                article_response = requests.get(
                    base_url,
                    params=article_params,
                    headers={'User-Agent': 'KnowTok/1.0'},
                    timeout=10,
                    verify=True
                )
                
                if article_response.status_code == 200:
                    article_data = article_response.json()
                    if 'query' in article_data and 'pages' in article_data['query']:
                        page_data = list(article_data['query']['pages'].values())[0]
                        extract = page_data.get('extract', '')
                        
                        # 使用OpenAI优化内容（如果启用）
                        if Config.USE_OPENAI and extract:
                            try:
                                optimized_extract = summarize_article(extract)
                                if optimized_extract:
                                    extract = optimized_extract
                                logger.info(f"*************** openai******** {extract}")
                            except Exception as e:
                                logger.error(f"Error optimizing content with OpenAI: {e}")
                        
                        article = {
                            'id': page_data['pageid'],
                            'title': page_data['title'],
                            'extract': extract[:300],
                            'url': f"https://{language}.wikipedia.org/wiki/{page_data['title'].replace(' ', '_')}",
                            'thumbnail': page_data.get('thumbnail', {}).get('source', None)
                        }
                        articles.append(article)
        
        logger.info(f"Successfully processed {len(articles)} articles")
        return articles
        
    except Exception as e:
        logger.error(f"Error fetching articles: {str(e)}")
        return []

# 辅助函数
def get_english_title(article_id: str) -> str:
    """返回英文标题"""
    titles = {
        # ...titles mapping...
    }
    return titles.get(article_id, 'Unknown Title')

def get_english_extract(article_id: str) -> str:
    """返回英文摘要"""
    extracts = {
        # ...extracts mapping...
    }
    return extracts.get(article_id, 'No content available')
