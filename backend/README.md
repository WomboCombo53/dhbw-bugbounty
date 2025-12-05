# Bug Bounty Tracker - Backend

Express.js REST API for the Bug Bounty Tracker application.

## Features

- RESTful API for bug bounty management
- MongoDB integration with Mongoose ODM
- Input validation and sanitization
- Rate limiting for security
- CORS protection
- Helmet security headers
- Health check endpoint

## API Endpoints

### Bugs
- `GET /api/bugs` - Get all bugs (with filtering and pagination)
- `GET /api/bugs/:id` - Get a single bug by ID
- `POST /api/bugs` - Create a new bug report
- `PATCH /api/bugs/:id` - Update bug status
- `DELETE /api/bugs/:id` - Delete a bug report
- `GET /api/bugs/statistics/summary` - Get bug statistics

### Health
- `GET /health` - Health check endpoint

## Query Parameters

### GET /api/bugs
- `severity` - Filter by severity (low, medium, high, critical)
- `status` - Filter by status (open, in-progress, resolved, closed, rejected)
- `companyName` - Filter by company name (case-insensitive partial match)
- `limit` - Number of results to return (default: 50)
- `skip` - Number of results to skip (default: 0)

## Environment Variables

Create a `.env` file based on `.env.example`:

```env
PORT=3000
MONGODB_URI=mongodb://localhost:27017/bugbounty
NODE_ENV=development
CORS_ORIGIN=http://localhost:5173
```

## Installation

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Start production server
npm start
```

## Docker

```bash
# Build the image
docker build -t bugbounty-backend .

# Run the container
docker run -p 3000:3000 --env-file .env bugbounty-backend
```

## Bug Report Schema

```javascript
{
  title: String (required, max 200 chars),
  description: String (required, max 5000 chars),
  severity: String (required, enum: ['low', 'medium', 'high', 'critical']),
  companyName: String (required, max 100 chars),
  reporterEmail: String (required, valid email),
  bountyAmount: Number (optional, min 0),
  status: String (enum: ['open', 'in-progress', 'resolved', 'closed', 'rejected']),
  submittedAt: Date (auto-generated)
}
```

## Security Features

- Helmet.js for security headers
- Rate limiting (100 requests/15min per IP)
- POST rate limiting (10 requests/15min per IP)
- Input validation and sanitization
- CORS protection
- MongoDB injection protection via Mongoose

## Development

The server uses nodemon for auto-reloading during development:

```bash
npm run dev
```

## License

ISC
