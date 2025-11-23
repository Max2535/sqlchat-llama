# SQLChat-Llama
Conversational SQL Engine with Dynamic MSSQL Schema + Llama (Ollama Local)

SQLChat-Llama is a full-stack AI-driven SQL assistant that lets you query a Microsoft SQL Server database using natural language.
It dynamically reads your database schema, feeds it into Llama (running locally via Ollama), validates SQL for safety, executes it, and returns the result in a chat-style UI.

No schema upload required.
No manual configuration.
Just connect → auto-detect tables → chat with your database.

---

## 🚀 Features

### 🔍 Dynamic Schema Loader
- Automatically fetches database schema from MSSQL:
  - Tables
  - Columns
  - Data types
  - (Optional) PK/FK
- No manual DDL upload needed.

### 🤖 AI-Powered Querying
- Local AI model via **Ollama** (Llama 3 / 3.1 / 3.2 / 70B / 405B)
- Natural language → SQL (T-SQL)
- JSON output for easy parsing

### 🔒 Safety First
- SQL validation layer
- Blocks dangerous queries:
  `DROP`, `ALTER`, `TRUNCATE`, `DELETE`, `UPDATE`, `INSERT` (unless explicitly allowed)
- Restricts SQL to detected schema only

### 🖥 Fullstack UI
- Next.js 14 (App Router)
- Chat interface like ChatGPT
- Shows generated SQL + result set
- Auto-scroll, live feedback, pretty JSON rendering

### ⚙️ Backend
- Node.js + Express + TypeScript
- MSSQL connection via `mssql`
- Schema caching
- Modular architecture
- Clean service separation

---

## 📂 Project Structure (clean & readable)

A concise, annotated view of the project layout.

```text
sqlchat-llama/
├─ backend/
│  ├─ src/
│  │  ├─ index.ts            # Express server entry
│  │  ├─ config.ts           # Env & app configuration
│  │  ├─ routes/
│  │  │  ├─ schemaRoutes.ts  # Load DB schema endpoints
│  │  │  └─ chatRoutes.ts    # AI SQL chat endpoints
│  │  ├─ services/
│  │  │  ├─ dbClient.ts      # MSSQL connection wrapper
│  │  │  ├─ schemaLoader.ts  # Dynamic schema extractor
│  │  │  ├─ schemaStore.ts   # Schema cache & retrieval
│  │  │  ├─ promptBuilder.ts # Build prompts for Llama
│  │  │  ├─ sqlValidator.ts  # SQL safety & rules
│  │  │  └─ ollamaClient.ts  # Local Llama (Ollama) client
│  ├─ package.json
│  ├─ .env.example
│  └─ tsconfig.json
└─ frontend/
    ├─ app/
    │  └─ page.tsx            # Next.js App Router entry
    ├─ components/
    │  └─ SqlChat.tsx         # Chat UI component
    ├─ lib/
    │  └─ api.ts              # Lightweight backend API wrapper
    ├─ package.json
    └─ tsconfig.json
```

Highlights
- Backend:
  - Modular services for DB, schema, validation, and local Llama inference.
  - TypeScript + Express; env-driven config and schema caching.
- Frontend:
  - Next.js 14 app router with a single chat-focused UI component.
  - Simple API wrapper to interact with backend chat/schema endpoints.

Use this structure as a quick reference for navigation and responsibilities of each file/folder.

