# 🖼️ Ollama WebUI — Renaissance Edition

A premium, high-aesthetic web interface for your local Ollama models. Designed with a **Renaissance & Baroque** aesthetic, featuring glassmorphism, classical art backgrounds, and a zero-latency direct connection to your local AI.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![React](https://img.shields.io/badge/React-18.x-61dafb.svg)
![Tailwind](https://img.shields.io/badge/Tailwind-3.x-38bdf8.svg)
![Ollama](https://img.shields.io/badge/Ollama-Local-ORANGE.svg)

---

## ✨ Features

- 🏛️ **Classical Aesthetics**: Switch between a "Warm Renaissance" light theme and a "Moody Baroque" dark theme.
- ⚡ **Zero Backend**: Connects directly from your browser to Ollama (no middleman storage).
- 💾 **Local Storage History**: Your chats stay in your browser, private and secure.
- 🖼️ **Vision Support**: Upload images to LLaVA and other vision-capable models.
- 📜 **System Prompts**: Configure a global personality for your AI.
- 📤 **Import/Export**: Move your chat history between browsers as JSON files.
- 💎 **Premium Code Blocks**: macOS-style code containers with syntax highlighting and copy-to-clipboard.

---

## 🚀 Getting Started

### 1. Install Ollama
You **must** have Ollama installed on your machine for this WebUI to function.
- **Download:** [ollama.com/download](https://ollama.com/download)
- **Configure CORS:** By default, Ollama blocks browser requests. You need to enable them by setting an environment variable:
  - **Windows (PowerShell):** `$env:OLLAMA_ORIGINS="*"; ollama serve`
  - **Linux/Mac:** `OLLAMA_ORIGINS="*" ollama serve`

### 2. Run the App
```bash
# Clone the repository
git clone https://github.com/PRATIK-4751/OllamaWebUI.git

# Install dependencies
cd OllamaWebUI
npm install

# Start the dev server
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🎨 Customization (.env)

Everything is customizable! Copy `.env.example` to `.env` to change:

- `VITE_APP_TITLE`: Change the app name.
- `VITE_SYSTEM_PROMPT`: Set the AI's core personality.
- `VITE_BG_DARK` / `VITE_BG_LIGHT`: Use your own images as background textures.
- `VITE_AI_AVATAR`: Custom avatar for the assistant.

---

## ⚖️ How it compares to LM Studio?

| Feature | Ollama WebUI (This App) | LM Studio |
| :--- | :--- | :--- |
| **Aesthetics** | ✨ High-end Classical Art / Glassmorphism | 🔧 Industrial / Technical |
| **Footprint** | 🍃 Ultra-lightweight (Static Web App) | 🐘 Heavy Desktop Application |
| **Customization** | 🎨 Full control over UI, CSS, and Themes | 🔒 Hardcoded UI settings |
| **Access** | 🌍 Can be hosted on Vercel/GitHub Pages | 💻 Local Desktop only |
| **Focus** | 💬 Pure Chat Experience | 🛠️ Model Management & Quantization |

**Verdict:** If you want a **beautiful, customizable, and fast** chat experience that feels premium while using your local Ollama power—this is for you.

---

## 📜 License
MIT License. Feel free to clone, modify, and share!
