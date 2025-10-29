# Quick Start Guide

## Prerequisites
- Docker and Docker Compose installed
- Ports 3000, 8080, and 27017 available

## Starting the Application

1. **Start all services:**
   ```bash
   docker-compose up -d
   ```

2. **Check service status:**
   ```bash
   docker-compose ps
   ```

3. **View logs:**
   ```bash
   # All services
   docker-compose logs -f
   
   # Specific service
   docker-compose logs -f backend
   docker-compose logs -f frontend
   docker-compose logs -f mongodb
   ```

4. **Test the backend API:**
   ```bash
   curl http://localhost:3000/health
   ```

5. **Access the application:**
   - Frontend: http://localhost:8080
   - Backend API: http://localhost:3000
   - MongoDB: localhost:27017

## Stopping the Application

```bash
# Stop all services
docker-compose down

# Stop and remove volumes (deletes database data)
docker-compose down -v
```

## Development Mode

For local development without Docker:

1. **Start MongoDB:**
   ```bash
   docker run -d -p 27017:27017 --name mongodb mongo:7.0
   ```

2. **Backend (Terminal 1):**
   ```bash
   cd backend
   npm install
   npm run dev
   ```

3. **Frontend (Terminal 2):**
   ```bash
   cd frontend
   npm install
   npm run dev
   ```
   Access at: http://localhost:5173

## Testing the API

### Get all bugs:
```bash
curl http://localhost:3000/api/bugs
```

### Submit a bug:
```bash
curl -X POST http://localhost:3000/api/bugs \
  -H "Content-Type: application/json" \
  -d '{
    "title": "SQL Injection in Login Form",
    "description": "The login form is vulnerable to SQL injection attacks",
    "severity": "critical",
    "companyName": "Example Corp",
    "reporterEmail": "security@example.com",
    "bountyAmount": 5000
  }'
```

### Get statistics:
```bash
curl http://localhost:3000/api/bugs/statistics/summary
```

## Troubleshooting

### Backend not starting:
```bash
docker-compose logs backend
docker-compose restart backend
```

### Database connection issues:
```bash
docker-compose logs mongodb
docker-compose restart mongodb
```

### Port conflicts:
Edit `docker-compose.yml` to change port mappings:
```yaml
ports:
  - "3001:3000"  # Change 3001 to your preferred port
```

### Reset everything:
```bash
docker-compose down -v
docker-compose up -d --build
```

## Environment Variables

### Backend (.env)
- `PORT`: Backend server port (default: 3000)
- `MONGODB_URI`: MongoDB connection string
- `NODE_ENV`: Environment (development/production)
- `CORS_ORIGIN`: Allowed CORS origin

### Frontend
- `VITE_API_URL`: Backend API URL (default: http://localhost:3000)

## Architecture

```
┌─────────────┐      ┌─────────────┐      ┌─────────────┐
│   Frontend  │─────▶│   Backend   │─────▶│   MongoDB   │
│  (React)    │      │  (Express)  │      │  (Database) │
│  Port 8080  │◀─────│  Port 3000  │      │  Port 27017 │
└─────────────┘      └─────────────┘      └─────────────┘
```

## Next Steps

1. ✅ Submit a bug report through the UI
2. ✅ View submitted bugs in the list
3. ✅ Check MongoDB data persistence
4. 🔜 Add authentication
5. 🔜 Deploy to Kubernetes
6. 🔜 Add email notifications
