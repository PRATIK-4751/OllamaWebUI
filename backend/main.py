"""
FastAPI Backend for Ollama WebUI
Handles Web Search, Image Search, URL Fetching, and PDF Parsing.
"""

from fastapi import FastAPI, HTTPException, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import httpx
from bs4 import BeautifulSoup
import re
import urllib.parse
import io
import asyncio
import logging
from pdfminer.high_level import extract_text
from duckduckgo_search import DDGS
from crawl4ai import AsyncWebCrawler
from crawl4ai.async_configs import BrowserConfig, CrawlerRunConfig

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

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
    try:
        soup = BeautifulSoup(html, "lxml")
        for tag in soup(["script", "style", "nav", "footer", "header", "aside"]):
            tag.decompose()
        text = soup.get_text(separator="\n", strip=True)
        text = re.sub(r"\n{3,}", "\n\n", text)
        return text[:8000]
    except Exception as e:
        logger.error(f"Error cleaning text: {e}")
        return ""


@app.get("/api/search")
async def web_search(q: str, max_results: int = 5):
    """Search using DuckDuckGo and fetch content using Crawl4AI (Playwright)."""
    if not q.strip():
        raise HTTPException(400, "Query cannot be empty")

    logger.info(f"Adding search for: {q}")

    try:
        # 1. Perform DuckDuckGo Search
        try:
            with DDGS() as ddgs:
                raw = list(ddgs.text(q, max_results=max_results))
        except Exception as e:
            logger.error(f"DuckDuckGo search failed: {e}")
            raise HTTPException(500, f"Search engine error: {e}")

        results = []
        for item in raw:
            results.append({
                "title": item.get("title", ""),
                "url": item.get("href", ""),
                "snippet": item.get("body", ""),
                "content": item.get("body", ""), # Fallback to snippet initially
            })


        # 2. Fetch Content with Crawl4AI
        # Configure browser for Docker environment (headless, no-sandbox)
        browser_config = BrowserConfig(
            headless=True,
            verbose=True,
            extra_args=["--no-sandbox", "--disable-dev-shm-usage"]
        )
        run_config = CrawlerRunConfig(
            word_count_threshold=10,
            excluded_tags=['nav', 'footer', 'header', 'aside'],
            exclude_external_links=True,
            process_iframes=False,
            remove_overlay_elements=True
        )

        async with AsyncWebCrawler(config=browser_config) as crawler:
            for r in results[:2]: # Limit to top 2 to avoid timeout/memory issues

                try:
                    logger.info(f"Crawling: {r['url']}")
                    result = await crawler.arun(url=r["url"], config=run_config)
                    
                    if result.success:
                        # Prefer markdown, fallback to cleaned HTML
                        content = result.markdown if result.markdown else clean_text(result.html)
                        if content:
                             r["content"] = content[:5000] # Limit content length
                             logger.info(f"Successfully crawled {r['url']} ({len(content)} chars)")
                        else:
                             logger.warning(f"Crawled {r['url']} but got empty content")
                    else:
                        logger.warning(f"Failed to crawl {r['url']}: {result.error_message}")
                        
                except Exception as e:
                    logger.error(f"Exception exploring {r['url']}: {e}")
                    # Fallback to simple HTTP if browser crashes
                    try:
                        async with httpx.AsyncClient(timeout=5) as client:
                            resp = await client.get(r["url"], headers=HEADERS)
                            r["content"] = clean_text(resp.text)[:3000]
                    except:
                        pass

        return {"query": q, "results": results}

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"General search API error: {e}")
        raise HTTPException(500, f"Search failed: {str(e)}")


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
        logger.error(f"Image search failed: {e}")
        raise HTTPException(500, f"Image search failed: {str(e)}")


class UrlRequest(BaseModel):
    url: str


@app.post("/api/url/fetch")
async def fetch_url(req: UrlRequest):
    """Fetch a URL using Crawl4AI (Playwright) for accurate content extraction."""
    if not req.url.strip():
        raise HTTPException(400, "URL cannot be empty")

    logger.info(f"Fetching URL: {req.url}")

    try:
        browser_config = BrowserConfig(
            headless=True,
            verbose=True,
            extra_args=["--no-sandbox", "--disable-dev-shm-usage"]
        )
        run_config = CrawlerRunConfig(
             word_count_threshold=10,
             remove_overlay_elements=True
        )

        async with AsyncWebCrawler(config=browser_config) as crawler:
            result = await crawler.arun(url=req.url, config=run_config)
            
            if not result.success:
                raise Exception(f"Crawl failed: {result.error_message}")
            
            title = req.url
            # Try to parse title from HTML if available
            if result.html:
                 try:
                    soup = BeautifulSoup(result.html, "lxml")
                    if soup.title and soup.title.string:
                        title = soup.title.string.strip()
                 except:
                     pass

            content = result.markdown if result.markdown else clean_text(result.html)

            return {
                "url": req.url,
                "title": title,
                "content": content[:20000],
            }

    except Exception as e:
        logger.error(f"Crawl4AI failed for {req.url}: {e}")
        # Fallback to HTTPX
        try:
            async with httpx.AsyncClient(timeout=15, follow_redirects=True) as client:
                resp = await client.get(req.url, headers=HEADERS)
                resp.raise_for_status()
                content = clean_text(resp.text)
                return {
                    "url": req.url,
                    "title": req.url,
                    "content": content[:10000]
                }
        except Exception as fallback_err:
             raise HTTPException(500, f"Failed to fetch URL: {str(e)}")


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
        logger.error(f"PDF parse error: {e}")
        raise HTTPException(500, f"Failed to parse PDF: {str(e)}")


@app.get("/api/health")
async def health():
    return {"status": "ok"}


# ==================== DATA ANALYSIS ====================

import pandas as pd
import matplotlib.pyplot as plt
import seaborn as sns
import base64

@app.post("/api/data/analyze")
async def analyze_data(file: UploadFile = File(...)):
    """Analyze a CSV file and return summary stats + plots."""
    if not file.filename.lower().endswith(".csv"):
        raise HTTPException(400, "File must be a CSV")

    try:
        content = await file.read()
        df = pd.read_csv(io.BytesIO(content))

        # Basic Stats
        summary = df.describe().to_string()
        columns = df.columns.tolist()
        
        info = {
            "rows": len(df),
            "columns": columns,
            "summary": summary,
            "head": df.head().to_string() # First 5 rows as context
        }

        plots = []

        # 1. Correlation Heatmap (if enough numeric cols)
        numeric_df = df.select_dtypes(include=['float64', 'int64'])
        if len(numeric_df.columns) > 1:
            plt.figure(figsize=(10, 8))
            sns.heatmap(numeric_df.corr(), annot=True, cmap='coolwarm', fmt=".2f")
            plt.title("Correlation Heatmap")
            
            buf = io.BytesIO()
            plt.savefig(buf, format='png', bbox_inches='tight')
            buf.seek(0)
            plots.append({
                "title": "Correlation Heatmap",
                "image": base64.b64encode(buf.getvalue()).decode('utf-8')
            })
            plt.close()

        # 2. Pairplot (for first 4 numeric vars to avoid clutter)
        if len(numeric_df.columns) >= 2:
            try:
                # Limit to 500 samples for speed
                sample_df = numeric_df.sample(min(500, len(df))) if len(df) > 500 else numeric_df
                sns.pairplot(sample_df.iloc[:, :4])
                
                buf = io.BytesIO()
                plt.savefig(buf, format='png', bbox_inches='tight')
                buf.seek(0)
                plots.append({
                    "title": "Pairplot (Top 4 Numeric)",
                    "image": base64.b64encode(buf.getvalue()).decode('utf-8')
                })
                plt.close()
            except Exception as e:
                logger.warning(f"Pairplot failed: {e}")

        # 3. Distribution (Histogram) of first numeric column
        if len(numeric_df.columns) > 0:
            first_col = numeric_df.columns[0]
            plt.figure(figsize=(8, 6))
            sns.histplot(df[first_col], kde=True)
            plt.title(f"Distribution of {first_col}")
            
            buf = io.BytesIO()
            plt.savefig(buf, format='png', bbox_inches='tight')
            buf.seek(0)
            plots.append({
                "title": f"Distribution: {first_col}",
                "image": base64.b64encode(buf.getvalue()).decode('utf-8')
            })
            plt.close()

        return {
            "filename": file.filename,
            "info": info,
            "plots": plots
        }

    except Exception as e:
        logger.error(f"Data analysis failed: {e}")
        raise HTTPException(500, f"Analysis failed: {str(e)}")
