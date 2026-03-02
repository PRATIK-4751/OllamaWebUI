<table>
  <tr>
    <td><img src="public/assets/ai-avatar.jpg" width="80" style="border-radius: 20px;"></td>
    <td><h1>Ollama WebUI — Renaissance Edition</h1></td>
  </tr>
</table>

A beautiful, high-aesthetic web interface for your local Ollama models. Fast, private, and supercharged with advanced features.

## 🖼️ Gallery

### Home Page
![Home Page](public/assets/home.png)

### Vision Capabilities
![Vision](https://github.com/PRATIK-4751/OllamaWebUI/blob/main/public/assets/visiontest.png)

### Chat Interface
![Chat Section](public/assets/textinterface.png)

## Features

- **Chat with any Ollama model** — Full support for text, vision, and multimodal models.
- **Web Search** — Real-time search powered by DuckDuckGo and **Crawl4AI** (Playwright).
- **Image Search** — Visual results directly in your chat flow.
- **PDF Intelligence** — Upload PDFs and perform instant Q&A (server-side parsing).
- **URL Fetching** — Extract content from any website for AI context.
- **Voice & TTS** — Speech-to-text input and "Read Aloud" voice responses.
- **Prompt Templates** — Pre-defined high-quality prompts to get you started.
- **Premium Animations** — Smooth message slide-ins, pulsing effects, shimmer loading, and warm glow.
- **Auto-Rename Chat** — Double-click the chat title to rename it instantly.
- **Drag-and-Drop** — Drop images, PDFs, CSVs, or text files directly into the chat.
- **Scroll-to-Bottom** — Floating button appears on scroll up for quick navigation.
- **Export Chat** — Download your conversation history as a Markdown file.
- **Real-time Metrics** — View tokens per second (t/s) during generation.
- **Keyboard Shortcuts** — `Ctrl+Shift+N` (New Chat), `Ctrl+B` (Sidebar), `Esc` (Stop).
- **100% Private** — Runs entirely on your local machine.

##  Run with Docker (Any OS - One Command)

**Prerequisites:** Install [Docker Desktop](https://www.docker.com/products/docker-desktop/) for your OS (Windows, Mac, or Linux).

### Quick Start (Latest Pre-built Images)

```bash
docker run -d -p 3000:80 --name ollama-webui lucifero19/ollama-webui:latest
```

Open **[http://localhost:3000](http://localhost:3000)** in your browser.

### Full Stack (Frontend + Backend)

```bash
# Create network
docker network create ollama-network 2>/dev/null || true

# Run Backend
docker run -d -p 8000:8000 --name ollama-backend --network ollama-network lucifero19/ollama-backend:latest

# Run Frontend (connects to backend automatically)
docker run -d -p 3000:80 --name ollama-webui --network ollama-network -e BACKEND_URL=http://ollama-backend:8000 lucifero19/ollama-webui:latest
```

Open **[http://localhost:3000](http://localhost:3000)** in your browser.

### Update to Latest Version

```bash
docker pull lucifero19/ollama-webui:latest
docker pull lucifero19/ollama-backend:latest
docker stop ollama-webui ollama-backend 2>/dev/null || true
docker rm ollama-webui ollama-backend 2>/dev/null || true

# Then re-run the commands above
```

### Stop & Clean Up

```bash
docker stop ollama-webui ollama-backend
docker rm ollama-webui ollama-backend
```

##  Requirements

**Ollama** must be running with CORS enabled:

```powershell
# Windows
$env:OLLAMA_ORIGINS="*"; ollama serve

# Mac / Linux
OLLAMA_ORIGINS="*" ollama serve
```

##  Local Development

```bash
# Install & Run Frontend
npm install
npm run dev

# Install & Run Backend (in /backend)
pip install -r requirements.txt
pip install -r requirements.txt
playwright install --with-deps chromium
uvicorn main:app --reload --port 8000
```

