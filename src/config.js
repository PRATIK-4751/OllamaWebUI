// ===================================
// App Configuration
// ===================================
// All values can be customized via .env file.
// See .env.example for all available options.

const config = {
    // Ollama (direct connection — no backend needed!)
    // We use 127.0.0.1 instead of localhost for better compatibility in browsers
    ollamaUrl: import.meta.env.VITE_OLLAMA_URL || 'http://127.0.0.1:11434',

    // Model
    defaultModel: import.meta.env.VITE_DEFAULT_MODEL || 'llava:7b',

    // System prompt — sets the AI's personality and behavior
    systemPrompt: import.meta.env.VITE_SYSTEM_PROMPT || 'You are a helpful, friendly AI assistant. Be concise and clear in your responses. Use markdown formatting when appropriate.',

    // Branding
    appTitle: import.meta.env.VITE_APP_TITLE || 'Ollama WebUI',
    appSubtitle: import.meta.env.VITE_APP_SUBTITLE || 'Your local AI assistant — fast, private, and powerful',

    // Images / Avatars
    logoImage: import.meta.env.VITE_LOGO_IMAGE || '/assets/logo.jpg',
    aiAvatar: import.meta.env.VITE_AI_AVATAR || '/assets/ai-avatar.jpg',
    userAvatar: import.meta.env.VITE_USER_AVATAR || '/assets/user-avatar.jpg',

    // Backgrounds
    bgDark: import.meta.env.VITE_BG_DARK || '/assets/bg-dark.png',
    bgLight: import.meta.env.VITE_BG_LIGHT || '/assets/bg-light.png',

    // Theme
    primaryColor: import.meta.env.VITE_PRIMARY_COLOR || '#dc2626',
    defaultTheme: import.meta.env.VITE_DEFAULT_THEME || 'dark',

    // Feature toggles
    enableImageUpload: import.meta.env.VITE_ENABLE_IMAGE_UPLOAD !== 'false',
    enableChatSearch: import.meta.env.VITE_ENABLE_CHAT_SEARCH !== 'false',
    showModelInfo: import.meta.env.VITE_SHOW_MODEL_INFO !== 'false',

    // Welcome screen
    feature1Label: import.meta.env.VITE_FEATURE_1_LABEL || 'Lightning Fast',
    feature2Label: import.meta.env.VITE_FEATURE_2_LABEL || 'Smart Responses',
    feature3Label: import.meta.env.VITE_FEATURE_3_LABEL || '100% Private',
}

export default config
