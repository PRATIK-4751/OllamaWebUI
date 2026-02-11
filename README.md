# Ollama WebUI — Renaissance Edition

A beautiful, feature-rich web interface for your local Ollama models.

## Features

- **Chat with any Ollama model** — text, vision, multimodal
- **Web Search** — real-time search via DuckDuckGo (toggle ON/OFF)
- **Image Search** — visual results alongside text answers
- **PDF Upload & Q&A** — upload PDFs and ask questions about them
- **URL Fetching** — pull content from any URL into context
- **Voice Input & TTS** — speak your prompts, listen to responses
- **Prompt Templates** — quick-start prompts for common tasks
- **100% Local & Private** — your data never leaves your machine

## Run with Docker (One Command)

```bash
docker-compose up -d
```

This starts both the **frontend** (port 3000) and **backend** (port 8000).

Open **http://localhost:3000** in your browser.

> You can also pull the pre-built image:
> ```bash
> docker pull lucifero19/ollama-webui:latest
> ```

## Requirements

**Ollama** must be installed and running with CORS enabled:

```powershell
# Windows PowerShell
$env:OLLAMA_ORIGINS="*"; ollama serve
```

```bash
# Mac / Linux
OLLAMA_ORIGINS="*" ollama serve
```

## Local Development

```bash
# Frontend
npm install
npm run dev          # → http://localhost:5173

# Backend (in /backend)
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

Set `VITE_BACKEND_URL=http://127.0.0.1:8000` in `.env` for local dev.

## License

MIT
