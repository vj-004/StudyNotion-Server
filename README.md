# StudyNotion Server

Backend API for the StudyNotion platform, an ed-tech application where users can:

- Sign up/login with JWT authentication
- Create and manage courses
- Upload assets through Cloudinary
- Enroll in paid courses (Razorpay)
- Generate YouTube playlist based learning paths, including AI-assisted sectioning

This server is built with Node.js, Express, MongoDB (Mongoose), and integrates email, payments, media storage, and AI APIs.

## Repository Scope

This is the backend repository only.

- Backend: this repository
- Frontend implementation: https://github.com/vj-004/StudyNotion-Client

## Why run locally?

For this project, local development gives the best experience, especially for the YouTube course generation flow.

- Faster iteration and easier debugging for playlist parsing + section generation
- Better control over model behavior when testing AI prompts
- Recommended: run the full stack locally and connect a local LLM setup for best YouTube course creation results

Note: The current implementation in `createYoutubeCourseV2` uses the Google GenAI SDK (`gemini-2.5-flash`) by default.

## Prerequisites

- Node.js 18+
- npm 9+
- MongoDB running locally (or remote MongoDB URI)
- Cloudinary account
- Razorpay test credentials
- SMTP credentials (for email)
- Google API key with YouTube Data API access
- Gemini API key (if using current AI integration)

## Project Setup (Backend + Frontend in one common folder)

Recommended folder structure:

```text
study-notion/
	StudyNotion-Server/
	StudyNotion-Client/
```

Clone both repositories into one common parent folder:

```bash
mkdir study-notion
cd study-notion

git clone https://github.com/vj-004/StudyNotion-Server.git
git clone https://github.com/vj-004/StudyNotion-Client.git
```

Install dependencies:

```bash
cd StudyNotion-Server
npm install

cd ../StudyNotion-Client
npm install
```

### 1. Configure environment variables (backend)

In `StudyNotion-Server`:

1. Create `.env` from `.env.example`
2. Fill all values with your own credentials

Windows PowerShell:

```powershell
cd StudyNotion-Server
Copy-Item .env.example .env
```

### 2. Start backend

```bash
cd StudyNotion-Server
npm run dev
```

Server runs on `http://localhost:4000` by default.

### 3. Start frontend

In another terminal:

```bash
cd StudyNotion-Client
npm start
```

No additional path/config changes are required when both repos are inside the same parent folder.


## Server Scripts

- `npm run dev`: start server with nodemon
- `npm start`: start server with node

## Environment Variables

Use the included `.env.example` file as the source of truth.

Required variables used by this server:

- `PORT`
- `MONGODB_URL`
- `JWT_SECRET`
- `MAIL_HOST`
- `MAIL_USER`
- `MAIL_PASS`
- `CLOUD_NAME`
- `API_KEY`
- `API_SECRET`
- `THUMBNAIL_FOLDER`
- `FOLDER_NAME`
- `COURSES_VIDEOS_FOLDER` (legacy/optional, keep set for compatibility)
- `RAZORPAY_KEY`
- `RAZORPAY_SECRET`
- `WEBHOOK_SECRET` (optional unless webhook flow is enabled)
- `GOOGLE_API` (YouTube Data API)
- `GEMINI_API_KEY`

## Local LLM recommendation for YouTube course creation

For best results in YouTube course generation, run locally and use a local LLM workflow.

- Keep your server + client on localhost for lower latency and stable iterative testing
- Use local models for prompt tuning and section-grouping experiments
- If you switch from Gemini to a local inference server, update the AI call in `controllers/course.controller.js` (`createYoutubeCourseV2`)

## Security note

Never commit real secrets in `.env`. Keep only placeholders in `.env.example`.

## This README.md is AI generated but is proof read by me. If there is any issue please contact me.
