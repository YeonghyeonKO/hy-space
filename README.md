# HySpace · 좌석/회의실 예약 시스템

SK하이닉스 내부 좌석 및 회의실 예약 시스템.

## Architecture

- **Backend**: FastAPI + SQLAlchemy (async) + PostgreSQL
- **Frontend**: React 18 (Babel in-browser) + nginx
- **Infra**: Helm chart for Kubernetes, Docker Compose for local dev

## Quick Start (Local)

```bash
docker-compose up --build
```

- Frontend: http://localhost:8080
- Backend API: http://localhost:8000
- PostgreSQL: localhost:5432

Seed demo data:
```bash
curl -X POST http://localhost:8000/api/v1/seed
```

## Project Structure

```
├── backend/
│   ├── app/
│   │   ├── main.py          # FastAPI app
│   │   ├── config.py        # Settings
│   │   ├── database.py      # Async SQLAlchemy
│   │   ├── models/          # DB models
│   │   ├── schemas/         # Pydantic schemas
│   │   ├── routers/         # API routes
│   │   └── services/        # Business logic (seed)
│   ├── alembic/             # DB migrations
│   ├── Dockerfile
│   └── requirements.txt
├── frontend/
│   ├── HySpace.html         # Main entry
│   ├── app.jsx              # App shell + routing
│   ├── seat-booking.jsx     # SVG floor map + booking
│   ├── room-booking.jsx     # Time grid booking
│   ├── my-reservations.jsx  # My bookings list
│   ├── admin.jsx            # Layout editor + stats
│   ├── icons.jsx            # Icon components
│   ├── api.js               # API client
│   ├── nginx.conf
│   └── Dockerfile
├── infra/
│   └── helm/hyspace/        # Helm chart
├── docker-compose.yml
└── README.md
```

## Helm Deployment

```bash
helm install hyspace ./infra/helm/hyspace \
  --set instanceName=prod \
  --set postgresql.host=your-db-host \
  --set postgresql.password=your-password
```

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | /health | Health check |
| GET | /api/v1/campuses | List campuses with buildings/floors |
| GET | /api/v1/floors/{id} | Floor detail (seats, rooms, zones) |
| PUT | /api/v1/floors/{id}/layout | Save layout (admin) |
| GET | /api/v1/reservations/my | My reservations |
| GET | /api/v1/reservations?floor_id=&date= | Floor reservations |
| POST | /api/v1/reservations | Create reservation |
| DELETE | /api/v1/reservations/{id} | Cancel reservation |
| GET | /api/v1/users/me | Current user |
| GET | /api/v1/affiliations | List affiliations |
| GET | /api/v1/admin/stats/{floor_id} | Occupancy stats |
| POST | /api/v1/seed | Seed demo data (dev only) |
