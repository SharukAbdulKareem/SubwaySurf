
# Subway Surf Project README


Subway Surf is a web application designed to help users find Subway restaurant outlets in Kuala Lumpur. The application is built using Next.js for the frontend and FastAPI for the backend, leveraging various libraries and services to provide a seamless user experience.

![App Screenshot](https://github.com/SharukAbdulKareem/SubwaySurf/blob/ee609ab76a526823a8be358b73745b185e2c8504/mdhv%201.jpg)
![App Screenshot](https://github.com/SharukAbdulKareem/SubwaySurf/blob/ee609ab76a526823a8be358b73745b185e2c8504/mdhv%202.jpg)


## Table of Contents

1. Technologies Used
2. Architecture
3. Setup Instructions
4. Usage
5. Key Features
6. Technical Decisions
7. Environment Variables
8. Database Setup
9. Contributing
### Technologies Used
## Frontend:

- Next.js: A React framework for server-side rendering and static site generation.
- React: A JavaScript library for building user interfaces.
- Tailwind CSS: A utility-first CSS framework for styling.
- Leaflet: A JavaScript library for interactive maps.


## Backend:
- FastAPI: A modern web framework for building APIs with Python 3.6+ based on standard Python type hints.
- Supabase: An open-source Firebase alternative that provides a backend as a service.
- LangChain: A framework for developing applications powered by language models.

## Database:
- PostgreSQL: A powerful, open-source object-relational database system used by Supabase.
 Others:
- Selenium: A tool for automating web browsers, used for scraping Subway outlet data.
- Pydantic: Data validation and settings management using Python type annotations.

## Architecture
The application follows a client-server architecture:
- Frontend: The user interface is built with Next.js, which allows for both server-side rendering and static site generation. The frontend communicates with the backend API to fetch and display data.
- Backend: The FastAPI server handles API requests, processes data, and interacts with the Supabase database. It also manages the logic for querying and returning Subway outlet information.

Data Flow
- 1.The user interacts with the frontend, entering queries or searching for outlets.
- 2.The frontend sends requests to the FastAPI backend.
- 3.The backend processes the requests, interacts with the Supabase database, and returns the results.
- 4.The frontend displays the results to the user.

## Setup Instructions

Prerequisites: 
- Node.js (version 14 or higher)
- Python (version 3.8 or higher)
- PostgreSQL (if running Supabase locally)
- Git

## Database Setup in Supabase
Create a Table: Manually set up the outlets table in Supabase with the following 
columns:
- name: Text
- address: Text
- operating_hours: Text
- waze_link: Text

2. Run SQL Commands: Open the SQL editor in Supabase and execute the following commands to set up the necessary extensions and functions:


```bash
      CREATE EXTENSION IF NOT EXISTS vector;

   ALTER TABLE outlets
   ADD COLUMN IF NOT EXISTS embedding VECTOR(1536); -- Matches OpenAI's text-embedding-ada-002

   CREATE OR REPLACE FUNCTION match_outlets(query_embedding VECTOR(1536), match_threshold FLOAT, match_count INT)
   RETURNS TABLE (address TEXT, similarity FLOAT) AS $$
   BEGIN
       RETURN QUERY
       SELECT outlets.address, 1 - (outlets.embedding <=> query_embedding) AS similarity
       FROM outlets
       WHERE outlets.embedding IS NOT NULL
       AND 1 - (outlets.embedding <=> query_embedding) >= match_threshold
       ORDER BY similarity DESC
       LIMIT match_count;
   END;
   $$ LANGUAGE plpgsql;
```

# Running the Scraper
Navigate to the Scraper Directory and execute the following command:

```bash
   python scraper.py
```

## Frontend Setup

Clone the project

```bash
   git clone https://github.com/SharukAbdulKareem/SubwaySurf.git
```

Go to the project directory

```bash
  cd SubwaySurf/frontend
```

Install dependencies

```bash
  npm install
```

Set Up Environment Variables:
- Create a .env.local file in the frontend directory and add the following:
```bash
NEXT_PUBLIC_API_URL=http://localhost:3000
```

Install dependencies

```bash
  npm run dev
```
- Open your browser and navigate to http://localhost:3000.


## Backend Setup

1. Navigate to the Backend Directory:

```bash
   cd SubwaySurf/backend
```

2. Create a Virtual Environment:

```bash
    python -m venv venv
    source venv/bin/activate  # On Windows use `venv\Scripts\activate`
```
3. Install Dependencies:

```bash
    pip install -r requirements.txt
```
3. Install Dependencies:

```bash
    SUPABASE_URL=your_supabase_url
    SUPABASE_KEY=your_supabase_key
    OPENAI_API_KEY=your_openai_api_key
    GOOGLE_MAPS_API_KEY=your_google_maps_api_key
```
3. Run the FastAPI Server:

```bash
    uvicorn api:app --host 0.0.0.0 --port 8001
```
## Usage
- 1.Accessing the Application: After setting up and running both the frontend and backend, navigate to http://localhost:3000 to access the application.
- 2.Searching for Outlets: Use the search bar to find Subway outlets by entering relevant queries.
- 3.Interacting with the Map: View the locations of outlets on the interactive map.
- 4.Using the Chat Interface: Ask questions about Subway outlets and receive responses.

## Key Features
- Search Functionality: Users can search for Subway outlets by entering queries.
- Interactive Map: Displays the locations of Subway outlets on a map.
- Chat Interface: Provides a conversational interface for users to ask questions about outlets.
- Data Scraping: Automatically scrapes Subway outlet data using Selenium.
