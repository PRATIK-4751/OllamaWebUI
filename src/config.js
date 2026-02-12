const config = {

    ollamaUrl: import.meta.env.VITE_OLLAMA_URL || 'http://127.0.0.1:11434',



    backendUrl: import.meta.env.VITE_BACKEND_URL || '',


    defaultModel: import.meta.env.VITE_DEFAULT_MODEL || 'llava:7b',


    systemPrompt: import.meta.env.VITE_SYSTEM_PROMPT || 'You are a helpful, friendly AI assistant. Be concise and clear in your responses. Use markdown formatting when appropriate.',


    appTitle: import.meta.env.VITE_APP_TITLE || 'Ollama WebUI',
    appSubtitle: import.meta.env.VITE_APP_SUBTITLE || 'Your local AI assistant — fast, private, and powerful',


    logoImage: import.meta.env.VITE_LOGO_IMAGE || '/assets/logo.jpg',
    aiAvatar: import.meta.env.VITE_AI_AVATAR || '/assets/ai-avatar.jpg',
    userAvatar: import.meta.env.VITE_USER_AVATAR || '/assets/user-avatar.jpg',


    bgDark: import.meta.env.VITE_BG_DARK || '/assets/bg-dark.png',
    bgLight: import.meta.env.VITE_BG_LIGHT || '/assets/bg-light.png',


    primaryColor: import.meta.env.VITE_PRIMARY_COLOR || '#dc2626',
    defaultTheme: import.meta.env.VITE_DEFAULT_THEME || 'dark',


    enableImageUpload: import.meta.env.VITE_ENABLE_IMAGE_UPLOAD !== 'false',
    enableChatSearch: import.meta.env.VITE_ENABLE_CHAT_SEARCH !== 'false',
    showModelInfo: import.meta.env.VITE_SHOW_MODEL_INFO !== 'false',


    enableWebSearch: import.meta.env.VITE_ENABLE_WEB_SEARCH !== 'false',
    enablePdfUpload: import.meta.env.VITE_ENABLE_PDF_UPLOAD !== 'false',
    enableFileBrowser: import.meta.env.VITE_ENABLE_FILE_BROWSER !== 'false',
    enableVoice: import.meta.env.VITE_ENABLE_VOICE !== 'false',
    enablePromptTemplates: import.meta.env.VITE_ENABLE_PROMPT_TEMPLATES !== 'false',


    feature1Label: import.meta.env.VITE_FEATURE_1_LABEL || 'Lightning Fast',
    feature2Label: import.meta.env.VITE_FEATURE_2_LABEL || 'Smart Responses',
    feature3Label: import.meta.env.VITE_FEATURE_3_LABEL || '100% Private',
}

export default config
