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
try:
    from crawl4ai import AsyncWebCrawler
    from crawl4ai.async_configs import BrowserConfig, CrawlerRunConfig
    HAS_CRAWL4AI = True
except ImportError:
    HAS_CRAWL4AI = False
    logger = logging.getLogger(__name__)
    logging.basicConfig(level=logging.INFO)
    logging.getLogger(__name__).info("crawl4ai not installed — using httpx fallback for URL fetching")


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

    if not q.strip():
        raise HTTPException(400, "Query cannot be empty")

    logger.info(f"Adding search for: {q}")

    try:

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
                "content": item.get("body", ""),
            })



        # Enrich top results with full page content
        for r in results[:2]:
            try:
                if HAS_CRAWL4AI:
                    browser_config = BrowserConfig(
                        headless=True,
                        verbose=False,
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
                        logger.info(f"Crawling: {r['url']}")
                        crawl_result = await crawler.arun(url=r["url"], config=run_config)
                        if crawl_result.success:
                            content = crawl_result.markdown if crawl_result.markdown else clean_text(crawl_result.html)
                            if content:
                                r["content"] = content[:5000]
                                logger.info(f"Successfully crawled {r['url']} ({len(content)} chars)")
                        continue
                # httpx fallback (used when crawl4ai is not installed or fails)
                async with httpx.AsyncClient(timeout=8, follow_redirects=True) as client:
                    resp = await client.get(r["url"], headers=HEADERS)
                    fetched = clean_text(resp.text)
                    if fetched:
                        r["content"] = fetched[:5000]
                        logger.info(f"Fetched {r['url']} via httpx ({len(fetched)} chars)")
            except Exception as e:
                logger.error(f"Error enriching {r['url']}: {e}")

        return {"query": q, "results": results}

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"General search API error: {e}")
        raise HTTPException(500, f"Search failed: {str(e)}")


@app.get("/api/images")
async def image_search(q: str, max_results: int = 8):

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

    if not req.url.strip():
        raise HTTPException(400, "URL cannot be empty")

    logger.info(f"Fetching URL: {req.url}")

    try:
        content = ""
        title = req.url

        if HAS_CRAWL4AI:
            try:
                browser_config = BrowserConfig(
                    headless=True,
                    verbose=False,
                    extra_args=["--no-sandbox", "--disable-dev-shm-usage"]
                )
                run_config = CrawlerRunConfig(
                    word_count_threshold=10,
                    remove_overlay_elements=True
                )
                async with AsyncWebCrawler(config=browser_config) as crawler:
                    result = await crawler.arun(url=req.url, config=run_config)
                    if result.success:
                        if result.html:
                            try:
                                soup = BeautifulSoup(result.html, "lxml")
                                if soup.title and soup.title.string:
                                    title = soup.title.string.strip()
                            except:
                                pass
                        content = result.markdown if result.markdown else clean_text(result.html)
            except Exception as crawl_err:
                logger.warning(f"crawl4ai failed for {req.url}: {crawl_err}, falling back to httpx")

        # httpx fallback
        if not content:
            async with httpx.AsyncClient(timeout=15, follow_redirects=True) as client:
                resp = await client.get(req.url, headers=HEADERS)
                resp.raise_for_status()
                html = resp.text
                try:
                    soup = BeautifulSoup(html, "lxml")
                    if soup.title and soup.title.string:
                        title = soup.title.string.strip()
                except:
                    pass
                content = clean_text(html)

        if not content:
            raise HTTPException(500, "Could not extract content from URL")

        return {
            "url": req.url,
            "title": title,
            "content": content[:20000],
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Crawl4AI failed for {req.url}: {e}")

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




import pandas as pd
import matplotlib.pyplot as plt
import seaborn as sns
import base64

@app.post("/api/data/analyze")
async def analyze_data(file: UploadFile = File(...)):

    if not file.filename.lower().endswith(".csv"):
        raise HTTPException(400, "File must be a CSV")

    try:
        content = await file.read()
        df = pd.read_csv(io.BytesIO(content))


        summary = df.describe().to_string()
        columns = df.columns.tolist()

        info = {
            "rows": len(df),
            "columns": columns,
            "summary": summary,
            "head": df.head().to_string()
        }

        plots = []


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


        if len(numeric_df.columns) >= 2:
            try:

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
