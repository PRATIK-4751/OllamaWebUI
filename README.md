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

## 🚀 Quick Start - Run Locally

**After cloning this repository, follow these steps:**

### Prerequisites
- **Node.js** (v18 or higher) - [Download](https://nodejs.org/)
- **Python 3.11+** - [Download](https://www.python.org/)
- **Ollama** running locally with models installed

### Step 1: Install Backend Dependencies

```bash
cd backend
pip install -r requirements.txt
playwright install --with-deps chromium
```

### Step 2: Start the Backend Server

```bash
# In the backend folder
python main.py
# or
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

Backend will run on **http://localhost:8000**

### Step 3: Install Frontend Dependencies

Open a new terminal and navigate to the project root:

```bash
cd OllamaWebUI
npm install
```

### Step 4: Start the Frontend Server

```bash
npm run dev
```

Frontend will run on **http://localhost:5173** (or auto-selected port)

### Step 5: Access the Application

Open your browser to **http://localhost:5173**

---

## 🔧 Configure Ollama

**Ollama** must be running with CORS enabled:

```powershell
# Windows
$env:OLLAMA_ORIGINS="*"; ollama serve

# Mac / Linux
OLLAMA_ORIGINS="*" ollama serve
```

---

