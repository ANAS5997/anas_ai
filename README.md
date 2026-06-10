# Anas AI

A modern, production-ready AI assistant application created and developed by **Anas Ali**.

![Anas AI](https://img.shields.io/badge/Anas%20AI-v1.0-indigo)
![License](https://img.shields.io/badge/license-MIT-blue)

## Features

- **Modern UI** — Clean, responsive design with dark and light mode
- **Streaming responses** — Fast, real-time AI replies
- **Chat history** — Sidebar with conversation management
- **Copy & regenerate** — One-click copy and response regeneration
- **Export** — Download chats as PDF or TXT
- **Code highlighting** — Syntax-highlighted code blocks in responses
- **File upload** — Attach text files for analysis
- **Image upload** — Share images in conversations
- **Voice input** — Speech-to-text via Web Speech API
- **Text-to-speech** — Read responses aloud
- **Mobile-friendly** — Fully responsive layout

## Quick Start

### Prerequisites

- Node.js 18+
- An OpenAI-compatible API key

### Installation

```bash
# Clone or navigate to the project
cd anas.ai

# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Edit .env and add your OPENAI_API_KEY
```

### Development

```bash
npm run dev
```

This starts:
- Frontend at `http://localhost:5173`
- Backend at `http://localhost:3001`

### Production

```bash
npm run build
npm start
```

The server serves the built frontend and API on port 3001.

## Configuration

| Variable | Description | Default |
|----------|-------------|---------|
| `OPENAI_API_KEY` | Your API key | Required |
| `OPENAI_BASE_URL` | API base URL | `https://api.openai.com/v1` |
| `OPENAI_MODEL` | Model to use | `gpt-4o-mini` |
| `PORT` | Server port | `3001` |

Works with any OpenAI-compatible API (OpenAI, Azure OpenAI, local LLMs via Ollama, etc.).

## About

**Anas AI** is a custom AI assistant created and developed by **Anas Ali** — a software developer and AI enthusiast specializing in programming, automation, cybersecurity, and intelligent systems.

## Tech Stack

- **Frontend:** React, TypeScript, Vite, Tailwind CSS
- **Backend:** Node.js, Express
- **AI:** OpenAI-compatible API with streaming
- **State:** Zustand with localStorage persistence

## License

MIT
