# 🖼️ Ollama WebUI — Renaissance Edition

A premium, high-aesthetic web interface for your local Ollama models. Designed with a **Renaissance & Baroque** aesthetic, featuring glassmorphism, classical art backgrounds, and a zero-latency direct connection to your local AI.

![Ollama WebUI Demo](public/assets/demo.png)

---

## 🏛️ How it Works

This application is a **frontend-only** client. It speaks directly to your local Ollama instance using the `fetch` API. 

- **Detection**: The app automatically checks if Ollama is running on `http://localhost:11434` every 10 seconds.
- **Privacy**: All your chats are stored in your browser's `localStorage`. No data ever leaves your machine (except to talk to Ollama).
- **Zero Latency**: No backend server means one less layer between you and the model.

---

## 🚀 Requirement: Ollama is Mandatory

This UI **will not work** without Ollama installed on your system.
1. **Download Ollama**: [ollama.com](https://ollama.com)
2. **Launch with CORS**: Browsers block direct connections by default. You must enable `OLLAMA_ORIGINS` to let the WebUI connect:
   - **Windows (PowerShell)**: `$env:OLLAMA_ORIGINS="*"; ollama serve`
   - **Mac/Linux**: `OLLAMA_ORIGINS="*" ollama serve`

---

## ⚖️ vs. LM Studio

| Feature | Renaissance WebUI | LM Studio |
| :--- | :--- | :--- |
| **Fonts** | 🖋️ **Playfair Display** & **Outfit** | 🔠 Standard UI Fonts |
| **Aesthetics** | ✨ Historical Art & Glassmorphism | 🔧 Technical / Flat |
| **Customization** | 🎨 Full CSS/Theme control via `.env` | 🔒 Limited / Fixed |
| **Architecture** | 🍃 Zero-install Web (Ultra-light) | 🐘 Heavy Desktop Native App |
| **Inspiration** | 🏛️ Creative and Scholarly vibe | 🛠️ Engineering and Testing vibe |

**Verdict**: While LM Studio is great for model management, our WebUI provides a **cool, customizable atmosphere** that makes chatting with AI feel like an inspired session in a classical library.

---

## 🖋️ Design & Typography

We use a curated pairing of fonts for maximum "cool" factor:
- **Playfair Display**: A sophisticated serif for that "historical manuscript" feeling in titles.
- **Outfit**: A modern, geometric sans-serif for crystal-clear chat readability.
- **JetBrains Mono**: For razor-sharp code blocks.

---

## 📜 License
MIT. Clone it, skin it, make it yours.
