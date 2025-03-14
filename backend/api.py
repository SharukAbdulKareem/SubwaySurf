import os
import logging
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from supabase import create_client, Client
from pydantic import BaseModel
from typing import List, Optional
from langchain_openai import ChatOpenAI, OpenAIEmbeddings
from langchain.prompts import PromptTemplate
from config import Config, get_outlets_data
from dotenv import load_dotenv
from contextlib import asynccontextmanager
from langchain.memory import ConversationBufferMemory
from langchain.chains import ConversationChain

# Set up logging
logging.basicConfig(
    filename=Config.LOG_FILE,
    level=logging.INFO,
    format="%(asctime)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)

# Load environment variables
load_dotenv()
supabase_url = Config.SUPABASE_URL
supabase_key = Config.SUPABASE_KEY
openai_api_key = Config.OPENAI_API_KEY

# Initialize global variables
supabase: Client = create_client(supabase_url, supabase_key)
embeddings = OpenAIEmbeddings(api_key=Config.OPENAI_API_KEY)
llm = ChatOpenAI(model="gpt-4o-mini", api_key=Config.OPENAI_API_KEY)
memory = ConversationBufferMemory()
conversation = ConversationChain(
    llm=llm,
    memory=memory,
    verbose=True
)

# Define Pydantic models
class Outlet(BaseModel):
    name: str
    address: str
    operating_hours: str
    waze_link: str
    lat: Optional[float]
    lng: Optional[float]

class ChatOutlet(BaseModel):
    name: str
    address: str
    operating_hours: str
    waze_link: str

class QueryResponse(BaseModel):
    answer: str
    # Removed details field since we don't want to return outlet lists

# Initialize FastAPI app with lifespan
@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup logic
    try:
        response = supabase.table("outlets").select("embedding").limit(1).execute()
        if not response.data or not response.data[0].get("embedding"):
            logger.info("No embeddings found, initializing...")
            initialize_embeddings()
        logger.info("Application started.")
    except Exception as e:
        logger.error(f"Startup error: {e}")
        raise
    yield  # This is where the app runs
    # Shutdown logic
    logger.info("Application shutting down.")

app = FastAPI(title="Subway Outlets API", lifespan=lifespan)

# Add middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://subway-surf.vercel.app",  # Your Vercel domain
        "http://localhost:3000"  # for local development
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Health check endpoint
@app.get("/health")
async def health_check():
    try:
        # Test database connection
        outlets = get_outlets_data()
        logger.info(f"Health check: Database connection successful, found {len(outlets)} outlets")
        return {
            "status": "healthy",
            "database": "connected",
            "outlets_count": len(outlets)
        }
    except Exception as e:
        logger.error(f"Health check failed: {e}")
        return {
            "status": "unhealthy",
            "error": str(e)
        }

# Initialize embeddings in Supabase
def initialize_embeddings():
    try:
        outlets = get_outlets_data()
        for outlet in outlets:
            doc_text = f"Name: {outlet['name']}, Address: {outlet['address']}, Operating Hours: {outlet['operating_hours']}"
            embedding = embeddings.embed_query(doc_text)
            supabase.table("outlets").update({"embedding": embedding}).eq("address", outlet["address"]).execute()
        logger.info("Embeddings initialized successfully.")
    except Exception as e:
        logger.error(f"Error initializing embeddings: {e}")
        raise

@app.get("/outlets/", response_model=List[Outlet])
async def get_outlets():
    try:
        outlets = get_outlets_data()
        logger.info(f"Returning {len(outlets)} outlets")
        return outlets
    except Exception as e:
        logger.error(f"Error fetching outlets: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/query/", response_model=QueryResponse)
async def query_outlets(q: str):
    try:
        logger.info(f"Received query: {q}")
        q = q.strip()
        if not q or len(q) > 500:
            raise ValueError("Query must be non-empty and less than 500 characters.")
        logger.info("Query sanitized successfully")

        # Get relevant outlets using embeddings
        query_embedding = embeddings.embed_query(q)
        response = supabase.rpc("match_outlets", {
            "query_embedding": query_embedding,
            "match_threshold": 0.7,
            "match_count": 6,
        }).execute()
        matches = response.data

        # Prepare context from relevant outlets
        relevant_outlets = []
        seen_addresses = set()
        for match in matches:
            address = match.get("address")
            if address and address not in seen_addresses:
                outlet_response = supabase.table("outlets").select("*").eq("address", address).execute()
                if outlet_response.data:
                    relevant_outlets.append(outlet_response.data[0])
                    seen_addresses.add(address)

        context = "\n".join([
            f"Name: {o['name']}, Address: {o['address']}, Operating Hours: {o['operating_hours']}, Waze Link: {o['waze_link']}"
            for o in relevant_outlets
        ])

        # Create prompt with context and conversation history
        prompt = f"""Given the following outlet data and conversation history, answer the question in a structured format concisely without any asterisks.

Outlet Data:
{context}

Previous conversation context is maintained automatically.

Current Question: {q}

Please provide a concise answer addressing the specific query. If the question refers to previous context, use that information along with the outlet data to provide an accurate answer."""

        # Get response using conversation chain
        response = conversation.predict(input=prompt)
        logger.info(f"LLM response: {response}")

        return QueryResponse(answer=response)

    except ValueError as ve:
        logger.warning(f"Invalid query: {ve}")
        raise HTTPException(status_code=400, detail=str(ve))
    except Exception as e:
        logger.error(f"Error processing query: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Internal server error")

@app.get("/")
async def root():
    return {
        "message": "Welcome to the Subway Outlets API. Use /health for status, /outlets/ for data, or /query/?q=your_query for searches."
    }

if __name__ == "__main__":
    import uvicorn
    logger.info(f"Starting server on port {Config.PORT}")
    try:
        uvicorn.run(app, host="0.0.0.0", port=Config.PORT)
    except Exception as e:
        logger.error(f"Failed to start server: {e}")
        raise