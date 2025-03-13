import os
from dotenv import load_dotenv
from functools import lru_cache
import logging

load_dotenv()

# Set up logging
logger = logging.getLogger(__name__)

class Config:
    SUPABASE_URL = os.getenv("SUPABASE_URL")
    SUPABASE_KEY = os.getenv("SUPABASE_KEY")
    OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
    GOOGLE_MAPS_API_KEY = os.getenv("GOOGLE_MAPS_API_KEY")
    ALLOWED_ORIGINS = os.getenv("ALLOWED_ORIGINS", "http://localhost:8001").split(",")
    ENVIRONMENT = os.getenv("ENVIRONMENT", "development")
    LOG_FILE = "logs/app.log"
    PORT = int(os.getenv("PORT", 8001))
    CACHE_TTL = int(os.getenv("CACHE_TTL", 300))  # Cache timeout in seconds

    @classmethod
    def validate(cls):
        required_vars = ["SUPABASE_URL", "SUPABASE_KEY", "OPENAI_API_KEY", "GOOGLE_MAPS_API_KEY"]
        missing = [var for var in required_vars if not getattr(cls, var)]
        if missing:
            raise ValueError(f"Missing required environment variables: {', '.join(missing)}")

@lru_cache(maxsize=1)
def get_outlets_data():
    """Cache outlet data with a TTL"""
    from supabase import create_client
    supabase = create_client(Config.SUPABASE_URL, Config.SUPABASE_KEY)
    try:
        response = supabase.table("outlets").select("*").execute()
        logger.info(f"Fetched {len(response.data)} outlets from Supabase")
        return response.data
    except Exception as e:
        logger.error(f"Error fetching outlets from Supabase: {e}")
        raise


