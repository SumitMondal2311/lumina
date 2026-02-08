# Lumina

**Lumina** is a cloud-native video processing platform that transforms raw uploaded videos into playable assets using an asynchronous background job pipeline.

The system is designed to solve the **content bottleneck** problem: instead of manually handling large video files, users upload once and Lumina asynchronously processes, tracks progress, and serves playback-ready videos.

This project focuses on **real backend architecture**, not just UI — including presigned uploads, background workers, job orchestration, and cloud storage.

---

## 🚀 Core Features

- 📁 **Project-based workspace model** (multi-project per user)
- 🎥 **Direct video uploads to S3** via presigned URLs (no API proxying)
- ⚙️ **Asynchronous video processing pipeline** using BullMQ + Redis
- 📊 **Job-based progress tracking** (transcode, audio extraction, transcription, embeddings)
- 🔁 **Robust retry & failure handling** for background jobs
- ▶️ **Secure video playback** via presigned GET URLs
- 🧱 **Monorepo architecture** with shared packages

---

## 🧠 High-Level Architecture

### apps
- web (Next.js frontend)
- api (NestJS API)
- worker (Background job runner)

### packages
- database (Prisma schema + generated client)
- queue (BullMQ connection & queue helpers)
- tsconfig (shared typescript configs)
- ui (Shared UI components)
- validators (Shared Zod schemas)

### infra
- PostgreSQL (Primary database)
- Redis (Job queue backend)
- AWS S3 (Video object storage)

---

## 🔄 End-to-End Workflow

### 1. Project & Video Creation
- User creates a **project** (workspace)
- User creates a **video record** (initial state: `UPLOADING`)

### 2. Upload (Presigned PUT)
- Client requests an **upload URL**
- API validates file type & size
- API returns a **presigned S3 PUT URL**
- Client uploads video **directly to S3**

### 3. Upload Completion
- Client notifies API of upload success
- API:
  - Marks video as `PROCESSING`
  - Creates processing jobs (transcode, extract audio, etc.)
  - Enqueues jobs in BullMQ

### 4. Background Processing
- Worker picks up jobs from Redis queue
- Each job:
  - Moves through `PENDING → IN_PROGRESS → COMPLETED / FAILED`
  - Supports retries and failure recovery
- Video status is reconciled based on job outcomes

### 5. Playback (Presigned GET)
- When all jobs complete, video becomes `READY`
- Client requests a **playback URL**
- API returns a **presigned S3 GET URL**
- Browser streams video directly from S3

---

## 📦 Tech Stack

### Frontend
- Next.js (App Router)
- React Query
- shadcn/ui
- Tailwind CSS

### Backend
- NestJS
- Prisma + PostgreSQL
- BullMQ + Redis
- AWS S3 (presigned uploads & playback)

### Infra & Tooling
- Docker (local dev)
- pnpm (monorepo)
- Biome (linting & formatting)
- Zod (schema validation)

---

## 🗂️ Data Model Highlights

- **User**
  - `lastActiveProjectId` for seamless navigation
- **Project**
  - Workspace boundary
- **Video**
  - Lifecycle states: `UPLOADING → PROCESSING → READY / FAILED`
- **Job**
  - Idempotent background tasks with retries
- **Chunk**
  - Transcript segments with vector embeddings using pgvector

---

## 🛠️ Local Development

### Prerequisites
- Node.js 24.13.0
- pnpm
- Docker

### Setup
```bash
pnpm install
docker-compose up -d
