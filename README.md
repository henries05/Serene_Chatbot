# Serence – AI Mental Health Support Chatbot

Serence is an AI-powered mental health support chatbot designed to provide empathetic, calming, and structured conversations for users experiencing stress, anxiety, or emotional overwhelm.

Built as a hackathon project, Serence combines a modern chat interface with real-time AI responses, crisis-aware behavior, and optional agentic tools such as retrieval-augmented generation (RAG) and email summaries.

> **Important Disclaimer**
> Serence is not a medical device and is not a substitute for licensed mental health professionals, diagnosis, treatment, or emergency services.  
> If a user is in immediate danger or at risk of self-harm, they should contact local emergency services or a qualified crisis hotline immediately.

---

## Table of Contents

- [Overview](#overview)
- [Key Features](#key-features)
- [How the AI Works](#how-the-ai-works)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [Run Locally](#run-locally)
- [Deployment](#deployment)
  - [Vercel](#vercel)
  - [Docker](#docker)
  - [Railway](#railway)
- [RAG and Agent Tools](#rag-and-agent-tools)
- [How to Customize the Chatbot](#how-to-customize-the-chatbot)
- [Vibe-Coding Guide](#vibe-coding-guide)
- [Safety Notes](#safety-notes)
- [Roadmap](#roadmap)
- [License](#license)

---

## Overview

Serence was created to explore how conversational AI can support emotional well-being through:

- empathetic response generation
- supportive conversational design
- safety-aware crisis escalation
- grounded knowledge retrieval
- modern full-stack deployment

The application is optimized for a smooth user experience with streaming responses, a clean chat layout, mood-based quick-start flows, and optional retrieval tools for more grounded answers.

---

## Key Features

- **Real-time streaming chat** for more natural AI conversations
- **Clean UI with chat history sidebar**
- **Mood-based quick-start prompts** to reduce friction for first-time users
- **Crisis detection flow** for high-risk mental health situations
- **Light and dark mode**
- **Markdown-rendered messages** for better readability
- **Optional RAG pipeline** for grounded mental health information
- **Optional summary email tool** for sending conversation takeaways to users

---

## How the AI Works

Serence is more than a simple text-generation wrapper. Depending on your setup, it can work in two modes:

### 1. Standard Conversational AI Mode

In the default mode, the chatbot sends the user's message to a Gemini model and streams the response back to the frontend in real time.

This mode is ideal for:
- emotional support conversations
- journaling-style reflection
- calming or grounding suggestions
- lightweight coaching prompts

### 2. Agentic Tool-Using Mode

In the extended mode, Serence can act more like an AI agent. Instead of only generating a reply, it can decide when to use external tools such as:

- a retrieval tool for grounding answers in trusted knowledge
- an email tool for sending summaries
- future custom tools such as mood logging, session export, or therapist referral suggestions

This architecture makes the system more modular and extensible than a plain chatbot.

### Response Style

The chatbot is designed to respond in a tone that is:

- empathetic
- non-judgmental
- calm
- supportive
- easy to understand

The goal is not to imitate a therapist, but to create a safer and more emotionally supportive conversational experience.

### Crisis Awareness

For sensitive or high-risk inputs, the system can switch to a more direct and urgent response style and present emergency guidance. This is especially important in mental health applications, where tone and escalation policy matter as much as model quality.

---

## Tech Stack

### Frontend
- **Next.js** with App Router
- **React**
- **Tailwind CSS**

### Backend
- **Next.js API Routes** / serverless functions

### AI Layer
- **Google Gemini** via `@google/genai`

### Optional Agent / Retrieval Stack
- **LangGraph**
- **LangChain**
- **Pinecone**
- **Google Generative AI Embeddings**

### Optional Email Tooling
- **Nodemailer**
- **SMTP**

---

## Project Structure

A typical structure for Serence looks like this:

```bash
serence/
├── app/                 # Next.js app router pages and layouts
├── components/          # Reusable UI components
├── lib/                 # Utilities, prompts, helpers, AI config
├── api/ or app/api/     # API routes / serverless endpoints
├── tools/               # Optional LangGraph / tool implementations
├── public/              # Static assets
├── styles/              # Global styles
├── .env.local           # Local environment variables
├── package.json
└── README.md