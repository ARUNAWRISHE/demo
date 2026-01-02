# Timetable Management System

A full-stack web application for managing academic timetables, departments, staff, and subjects.

## Tech Stack

**Backend:**
- FastAPI (Python)
- MongoDB
- Motor (async MongoDB driver)

**Frontend:**
- React 19
- Tailwind CSS
- Radix UI components
- React Router DOM

## Prerequisites

- Docker and Docker Compose
- OR Node.js 22+ and Python 3.13+ (for local development)

## Quick Start with Docker

1. **Build and run all services:**
   ```bash
   docker-compose up --build
   ```

2. **Access the application:**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:8000
   - API Docs: http://localhost:8000/docs

3. **Stop the services:**
   ```bash
   docker-compose down
   ```

4. **Stop and remove volumes (clean database):**
   ```bash
   docker-compose down -v
   ```

## Local Development Setup

### Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn server:app --reload --port 8000
```

### Frontend

```bash
cd frontend
npm install --legacy-peer-deps
npm start
```

### MongoDB

Make sure MongoDB is running locally on port 27017, or update the `MONGO_URL` in `backend/.env`

## Environment Variables

### Backend (.env)
```
MONGO_URL=mongodb://localhost:27017
DB_NAME=test_database
CORS_ORIGINS=*
```

### Frontend (.env)
```
REACT_APP_BACKEND_URL=http://localhost:8000
```

## Features

- User authentication with session management
- Department management (CRUD operations)
- Staff management
- Subject management
- Timetable creation and viewing
- Time slot configuration

## API Endpoints

- `POST /api/auth/session` - Create session
- `GET /api/auth/me` - Get current user
- `POST /api/auth/logout` - Logout
- `GET /api/departments` - List departments
- `POST /api/departments` - Create department
- `DELETE /api/departments/{id}` - Delete department
- Similar endpoints for staff, subjects, and timetable

## Project Structure

```
.
├── backend/
│   ├── server.py          # FastAPI application
│   ├── requirements.txt   # Python dependencies
│   ├── Dockerfile         # Backend container
│   └── .env              # Backend config
├── frontend/
│   ├── src/
│   │   ├── pages/        # React pages
│   │   ├── components/   # React components
│   │   └── lib/          # Utilities
│   ├── Dockerfile        # Frontend container
│   ├── nginx.conf        # Nginx config for production
│   └── package.json      # Node dependencies
├── docker-compose.yml    # Docker orchestration
└── README.md
```

## Docker Commands

**View logs:**
```bash
docker-compose logs -f
docker-compose logs -f backend
docker-compose logs -f frontend
```

**Rebuild specific service:**
```bash
docker-compose up --build backend
docker-compose up --build frontend
```

**Access container shell:**
```bash
docker exec -it timetable-backend sh
docker exec -it timetable-mongodb mongosh
```

## License

MIT
