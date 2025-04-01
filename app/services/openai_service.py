import logging
from openai import OpenAI
from config import Config
import os

logger = logging.getLogger(__name__)

def summarize_article(text, max_length=150):
    try:
        logger.info("Attempting to summarize text with OpenAI")
        
        if not Config.OPENAI_API_KEY:
            logger.warning("No OpenAI API key found")
            return text[:max_length] + "..."
            
        # 最简化的初始化方式
        client = OpenAI(
            api_key=Config.OPENAI_API_KEY,
            base_url=Config.OPENAI_BASE_URL
        )
        
        logger.info("Making request to OpenAI API")
        response = client.chat.completions.create(
            model="qwen-plus",
            messages=[
                {"role": "system", "content": "You are a helpful assistant that summarizes text. Keep the summary concise and engaging."},
                {"role": "user", "content": f"Summarize this text in about 150 words: {text}"}
            ],
            max_tokens=150,
            temperature=0.7
        )
        
        summary = response.choices[0].message.content.strip()
        logger.info("Successfully received OpenAI response")
        return summary
        
    except Exception as e:
        logger.error(f"Error in OpenAI summarization: {str(e)}")
        logger.exception("Full traceback:")
        return text[:max_length] + "..."
