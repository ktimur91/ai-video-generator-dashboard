# AI Video Generator — Dashboard

Web dashboard for an AI tool that generates short videos for YouTube: script, voice-over, music, subtitles and background, then renders and publishes them to YouTube channels.

Part of a three-repo project:

| Repo | What it does | Stack |
| --- | --- | --- |
| **ai-video-generator-dashboard** (this one) | Web UI: create, edit, preview and publish videos | Vue 3, Composition API, Vite, Tailwind CSS |
| [ai-video-generator-backend](https://github.com/ktimur91/ai-video-generator-backend) | REST API: AI scripts, TTS, music, rendering queue, YouTube upload | Node.js, Express, Prisma, OpenAI / Gemini, ffmpeg, YouTube Data API |
| [ai-video-generator-render](https://github.com/ktimur91/ai-video-generator-render) | Video templates and rendering | React, Remotion, TypeScript, Tailwind CSS |

## Features

- Quick create: generate a video from a topic in one step
- AI assistant for scripts and titles, with a choice of AI provider (OpenAI or Gemini)
- Template editor and video background editor
- Voice settings (TTS) and a music selector
- Video grid with drag-and-drop ordering (vuedraggable) and version history
- Connecting several YouTube accounts and publishing from the dashboard
- Stacked modals (`useModalStack`) and a notification sound when a render finishes

## Structure

```
src/
  components/   AiAssistant, QuickCreate, TemplateEditorModal, VideoBackgroundEditor,
                VideoGrid, VideoCard, VideoVersions, VoiceSettingsModal,
                MusicSelectorModal, YouTubeAccountsModal, YouTubePublishModal
  composables/  useVideos, useModalStack, useNotificationSound
  api.js        API client
```

## Run locally

```bash
cp .env.example .env   # set the backend URL
npm i
npm run dev
```

## Author

Timur Kutumbaev, frontend developer (Vue 3, UI/UX). Telegram: [@ktim91](https://t.me/ktim91)
