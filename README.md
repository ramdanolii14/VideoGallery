# VideoGallery 

Public video gallery platform with admin-only uploads, user comments/likes, and per-video visibility control.

---

## Stack

- **Backend**: Node.js + Express (ESM) + PostgreSQL
- **Frontend**: React 18 + Vite + React Router

---

## Prerequisites

- Node.js 18+
- PostgreSQL 14+ (running locally or remote)

---

## Setup

### 1. Clone / unzip the project

```
video-gallery/
├── backend/
└── frontend/
```

### 2. Set up the backend

```bash
cd backend
npm install

# Copy env file and fill in your values
cp .env.example .env
```

Edit `.env`:

```env
PORT=4000
DATABASE_URL=postgresql://postgres:yourpassword@localhost:5432/video_gallery
JWT_SECRET=some_long_random_string_here
ADMIN_USERNAME=admin
ADMIN_EMAIL=admin@yourdomain.com
ADMIN_PASSWORD=your_secure_password
```

Create the database in PostgreSQL:
```sql
CREATE DATABASE video_gallery;
```

Seed the admin user:
```bash
npm run seed
```

Start the API:
```bash
npm run dev     # development (auto-restart)
npm start       # production
```

### 3. Set up the frontend

```bash
cd frontend
npm install
npm run dev     # opens http://localhost:5173
```

For production build:
```bash
npm run build   # outputs to frontend/dist/
```

---

## How it works

### Roles

| Feature | Guest | User | Admin |
|---|---|---|---|
| Browse & watch public videos | ✅ | ✅ | ✅ |
| Watch unlisted videos (via link) | ✅ | ✅ | ✅ |
| Watch private videos | | | ✅ |
| Like videos | | ✅ | ✅ |
| Comment | | ✅ | ✅ |
| Delete own comments | | ✅ | ✅ |
| Delete any comment | | | ✅ |
| Upload videos | | | ✅ |
| Edit video metadata | | | ✅ |
| Delete videos | | | ✅ |

### Visibility options

- **Public** — visible on the home page and in search
- **Unlisted** — hidden from listings, accessible via direct link only
- **Private** — only admin can see and watch

---

## API Endpoints

### Auth
- `POST /api/auth/register` — create user account
- `POST /api/auth/login` — get JWT token

### Videos
- `GET /api/videos` — list videos (`?search=&page=&limit=`)
- `GET /api/videos/:id` — get single video (increments view count)
- `POST /api/videos` — upload video (admin, multipart)
- `PATCH /api/videos/:id` — edit title/description/visibility (admin)
- `PATCH /api/videos/:id/thumbnail` — update thumbnail (admin, multipart)
- `DELETE /api/videos/:id` — delete video + files (admin)
- `POST /api/videos/:id/like` — like a video (auth)
- `DELETE /api/videos/:id/like` — unlike (auth)
- `GET /api/videos/:id/liked` — check if current user liked (auth)

### Comments
- `GET /api/videos/:videoId/comments` — list comments
- `POST /api/videos/:videoId/comments` — post comment (auth)
- `DELETE /api/videos/:videoId/comments/:commentId` — delete (owner or admin)

---

## File storage

Uploaded files are stored on disk under `backend/uploads/`:

```
backend/uploads/
├── videos/       ← video files
└── thumbnails/   ← thumbnail images
```

Served statically at `/uploads/videos/filename` and `/uploads/thumbnails/filename`.

For production, consider serving these via nginx or moving to object storage (S3, R2, etc.).

---

## Production notes

- Set a strong `JWT_SECRET` (32+ random characters)
- Change the default admin password immediately after seeding
- Put nginx in front of Express for static file serving and HTTPS
- For large video files, increase nginx `client_max_body_size`
