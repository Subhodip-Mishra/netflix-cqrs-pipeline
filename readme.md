# Netflix-Style Video Processing Pipeline

A production-inspired video processing pipeline built with CQRS architecture. Upload a video and it automatically transcodes to 4 resolutions using FFmpeg, stores HLS segments for adaptive streaming, and notifies via Redis pub/sub — all running in Docker with one command.

## Architecture

```
User
 │
 ▼
API Container          → accepts upload, saves to shared storage, pushes BullMQ job
 │
 ▼
Redis (BullMQ Queue)   → holds jobs, coordinates workers, prevents duplicate processing
 │
 ▼
Worker Container       → picks up job, runs FFmpeg, generates HLS segments
 │
 ▼
Subscriber Container   → listens for video-ready event, reacts (notify, cache, etc.)
 │
 ▼
PostgreSQL             → stores video metadata (PENDING → READY)
```

Pattern: **CQRS** — API, Worker, and Subscriber are completely decoupled. Each process has one job and knows nothing about the others.

## What Happens When You Upload a Video

1. API receives the file → saves to `/storage/uploads/` (shared Docker volume)
2. Postgres row created with `status: PENDING`
3. Job pushed to BullMQ queue with `videoId` and `filePath`
4. Worker picks up the job automatically
5. FFmpeg transcodes to 4 resolutions: **1080p, 720p, 480p, 360p**
6. HLS segments (`.ts` files) written to `/storage/processed/{videoId}/`
7. Master playlist (`master.m3u8`) generated for adaptive bitrate streaming
8. Postgres updated to `status: READY` with `streamUrl`
9. Redis publishes `video-ready` event
10. Subscriber receives event and logs completion

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Runtime | Node.js + TypeScript |
| API | Express |
| Job Queue | BullMQ + Redis |
| Video Processing | FFmpeg |
| ORM | Drizzle ORM |
| Database | PostgreSQL |
| Containers | Docker + Docker Compose |

## Project Structure

```
src/
├── api/
│   ├── index.ts              # Express server entry point
│   └── routes/
│       └── video.command.ts  # Upload route + Multer middleware
├── commands/
│   └── upload-video.ts       # DB insert + queue push logic
├── worker/
│   └── index.ts              # BullMQ worker + FFmpeg transcoding
├── subscriber/
│   └── index.ts              # Redis pub/sub listener
├── queue/
│   └── video.queue.ts        # BullMQ queue definition
├── db/
│   ├── index.ts              # Drizzle DB connection
│   └── schema.ts             # Videos table schema
└── queries/
    └── get-video.ts          # Read side queries
```

## Getting Started

### Prerequisites

- Docker + Docker Compose
- Node.js 20+
- pnpm

### Setup

```bash
# clone the repo
git clone https://github.com/Subhodip-Mishra/netflix-cqrs-pipeline.git
cd netflix-cqrs-pipeline

# install dependencies
pnpm install

# copy env file
cp .env.example .env

# create storage directories
mkdir -p storage/uploads storage/processed

# start all containers
docker compose up --build -d
```

### Push Database Schema

```bash
pnpm drizzle-kit push
```

### Upload a Video

```bash
curl -X POST http://localhost:3000/api/videos/upload \
  -F "title=My Video" \
  -F "video=@/path/to/video.mp4"
```

### Watch the Pipeline

```bash
# worker logs (FFmpeg transcoding)
docker compose logs worker_container -f

# subscriber logs (event received)
docker compose logs subscriber_container -f
```

## Output Structure

After processing, your video is available as:

```
storage/processed/{videoId}/
├── 1080p_000.ts
├── 1080p_001.ts
├── ...
├── 1080p.m3u8
├── 720p_000.ts
├── ...
├── 720p.m3u8
├── 480p.m3u8
├── 360p.m3u8
└── master.m3u8    ← point your video player here
```

Load `master.m3u8` in any HLS-compatible player (VLC, hls.js, Video.js) and it will automatically select the best quality based on network speed.

## Environment Variables

```env
DATABASE_URL=postgresql://postgres:password@localhost:5432/cqrs_netflix_clone
REDIS_HOST=redis_db
STORAGE_PATH=/storage
PORT=3000
```

## Key Concepts Demonstrated

**CQRS** — Commands (write) and Queries (read) are separated. The upload route calls a command function. Read routes call query functions. Neither knows about the other.

**BullMQ Job Queue** — Jobs are processed reliably with automatic retries, locking to prevent duplicate processing, and persistence in Redis.

**HLS Streaming** — Video is split into small `.ts` segment files with `.m3u8` playlist files. This is how Netflix, YouTube, and Twitch deliver video — the player downloads segments progressively instead of the whole file.

**Docker Shared Volume** — API and Worker containers share the same `/storage` folder via a bind mount, simulating a shared filesystem without a cloud storage dependency.

## What's Next

- [ ] Redis caching for video metadata
- [ ] Query side — GET /videos endpoint
- [ ] Nginx for serving HLS segments
- [ ] WebSocket notifications when video is ready
- [ ] Thumbnail generation

## Author

Built by [@suvodippmishhra](https://x.com/suvodippmishhra) as a deep-dive into backend engineering fundamentals.