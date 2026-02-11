"""
FastAPI Backend for Ollama WebUI
Handles: Web Search, Image Search, URL Fetching, PDF Parsing
Uses duckduckgo-search for reliable search results
"""

from fastapi import FastAPI, HTTPException, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import httpx
from bs4 import BeautifulSoup
import re
import urllib.parse
import io
from pdfminer.high_level import extract_text
from duckduckgo_search import DDGS

app = FastAPI(title="Ollama WebUI Backend")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
}


def clean_text(html: str) -> str:
    """Extract clean text from HTML."""
    soup = BeautifulSoup(html, "lxml")
    for tag in soup(["script", "style", "nav", "footer", "header", "aside"]):
        tag.decompose()
    text = soup.get_text(separator="\n", strip=True)
    text = re.sub(r"\n{3,}", "\n\n", text)
    return text[:8000]


# ==================== WEB SEARCH ====================

@app.get("/api/search")
async def web_search(q: str, max_results: int = 5):
    """Search using DuckDuckGo and optionally fetch page content."""
    if not q.strip():
        raise HTTPException(400, "Query cannot be empty")

    try:
        with DDGS() as ddgs:
            raw = list(ddgs.text(q, max_results=max_results))

        results = []
        for item in raw:
            results.append({
                "title": item.get("title", ""),
                "url": item.get("href", ""),
                "snippet": item.get("body", ""),
                "content": item.get("body", ""),
            })

        # Fetch full content from top 2 results for richer context
        async with httpx.AsyncClient(timeout=8, follow_redirects=True) as client:
            for r in results[:2]:
                try:
                    page = await client.get(r["url"], headers=HEADERS)
                    r["content"] = clean_text(page.text)[:3000]
                except Exception:
                    pass  # Keep snippet as fallback

        return {"query": q, "results": results}

    except Exception as e:
        raise HTTPException(500, f"Search failed: {str(e)}")


# ==================== IMAGE SEARCH ====================

@app.get("/api/images")
async def image_search(q: str, max_results: int = 8):
    """Search for images using DuckDuckGo."""
    if not q.strip():
        raise HTTPException(400, "Query cannot be empty")

    try:
        with DDGS() as ddgs:
            raw = list(ddgs.images(q, max_results=max_results))

        images = []
        for item in raw:
            images.append({
                "url": item.get("image", ""),
                "thumbnail": item.get("thumbnail", ""),
                "title": item.get("title", ""),
                "source": item.get("source", ""),
            })

        return {"query": q, "images": images}

    except Exception as e:
        raise HTTPException(500, f"Image search failed: {str(e)}")


# ==================== URL FETCHING ====================

class UrlRequest(BaseModel):
    url: str


@app.post("/api/url/fetch")
async def fetch_url(req: UrlRequest):
    """Fetch a URL and extract readable text content."""
    if not req.url.strip():
        raise HTTPException(400, "URL cannot be empty")

    try:
        async with httpx.AsyncClient(timeout=15, follow_redirects=True) as client:
            resp = await client.get(req.url, headers=HEADERS)
            resp.raise_for_status()

            soup = BeautifulSoup(resp.text, "lxml")
            title = soup.title.string if soup.title else req.url

            content = clean_text(resp.text)

            return {
                "url": req.url,
                "title": title.strip() if title else req.url,
                "content": content,
            }

    except Exception as e:
        raise HTTPException(500, f"Failed to fetch URL: {str(e)}")


# ==================== PDF PARSING ====================

@app.post("/api/pdf/parse")
async def parse_pdf(file: UploadFile = File(...)):
    """Parse a PDF file and extract text from all pages."""
    if not file.filename.lower().endswith(".pdf"):
        raise HTTPException(400, "File must be a PDF")

    try:
        content = await file.read()
        text = extract_text(io.BytesIO(content))

        pages = text.count('\f') + 1 if text else 0

        return {
            "name": file.filename,
            "content": text.strip()[:50000],
            "pages": pages,
        }
    except Exception as e:
        raise HTTPException(500, f"Failed to parse PDF: {str(e)}")


# ==================== HEALTH ====================

@app.get("/api/health")
async def health():
    return {"status": "ok"}
