/**
 * Prompt Templates — Pre-built presets for common tasks
 */

const promptTemplates = [
    {
        id: 'code-review',
        icon: 'Search',
        title: 'Code Review',
        description: 'Analyze and review code',
        prompt: 'Review the following code. Point out bugs, improvements, and best practices:',
    },
    {
        id: 'summarize',
        icon: 'FileText',
        title: 'Summarize',
        description: 'Condense long text',
        prompt: 'Summarize the following text concisely, keeping the key points:',
    },
    {
        id: 'explain',
        icon: 'Lightbulb',
        title: 'Explain Simply',
        description: 'ELI5 explanation',
        prompt: 'Explain the following concept in simple terms that a beginner could understand:',
    },
    {
        id: 'translate',
        icon: 'Languages',
        title: 'Translate',
        description: 'Translate to any language',
        prompt: 'Translate the following text to the specified language:',
    },
    {
        id: 'debug',
        icon: 'Bug',
        title: 'Debug',
        description: 'Find and fix bugs',
        prompt: 'Debug the following code. Identify the issue and provide a fix:',
    },
    {
        id: 'creative',
        icon: 'Sparkles',
        title: 'Creative Writing',
        description: 'Stories, poems, ideas',
        prompt: 'Write a creative piece based on the following theme or idea:',
    },
    {
        id: 'data-analysis',
        icon: 'BarChart3',
        title: 'Data Analysis',
        description: 'Analyze data patterns',
        prompt: 'Analyze the following data and provide insights, patterns, and recommendations:',
    },
    {
        id: 'email',
        icon: 'Mail',
        title: 'Draft Email',
        description: 'Professional emails',
        prompt: 'Draft a professional email based on the following context:',
    },
]

export default promptTemplates
