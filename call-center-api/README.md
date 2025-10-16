# Call Center API

A scalable FastAPI backend for call center management with 3CX integration, designed to support real-time call tracking, agent management, lead management, and comprehensive analytics.

## Features

### Core Functionality
- **Real-time Call Management**: Track live calls, call history, and call statistics
- **Agent Management**: Monitor agent status, performance metrics, and availability
- **Lead Management**: Manage customer leads with call tracking and follow-up scheduling
- **3CX Integration**: Full integration with 3CX phone system for call control
- **WebSocket Support**: Real-time updates for dashboard and live monitoring
- **RESTful API**: Comprehensive REST API for all operations

### Technical Features
- **Async/Await**: Built with FastAPI for high performance async operations
- **PostgreSQL**: Robust database with async support via asyncpg
- **Real-time Updates**: WebSocket connections for live data streaming
- **Background Tasks**: Celery integration for scheduled tasks and data sync
- **Docker Support**: Complete containerization for easy deployment
- **API Documentation**: Auto-generated OpenAPI/Swagger documentation

## Quick Start

### Prerequisites
- Python 3.11+
- PostgreSQL 13+
- Redis 6+
- 3CX Phone System with API access

### Installation

1. **Clone the repository**
```bash
git clone <repository-url>
cd call-center-api
```

2. **Create virtual environment**
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

3. **Install dependencies**
```bash
pip install -r requirements.txt
```

4. **Environment setup**
```bash
cp .env.example .env
# Edit .env with your configuration
```

5. **Database setup**
```bash
# Create database
createdb call_center_db

# Run migrations (if using Alembic)
alembic upgrade head
```

6. **Start the application**
```bash
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

### Docker Setup (Recommended)

1. **Start all services**
```bash
docker-compose up -d
```

2. **Check service status**
```bash
docker-compose ps
```

3. **View logs**
```bash
docker-compose logs -f api
```

## API Documentation

Once running, access the interactive API documentation:
- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

## Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql+asyncpg://postgres:password@localhost:5432/call_center_db` |
| `THREECX_BASE_URL` | 3CX server base URL | `https://your-3cx-server.com` |
| `THREECX_USERNAME` | 3CX API username | `admin` |
| `THREECX_PASSWORD` | 3CX API password | `password` |
| `SECRET_KEY` | JWT secret key | `your-super-secret-key` |
| `REDIS_URL` | Redis connection string | `redis://localhost:6379/0` |

### 3CX Integration Setup

1. **Enable 3CX API**
   - Log into 3CX Management Console
   - Go to Settings > API
   - Enable Call Control API
   - Create API user credentials

2. **Configure API Access**
   - Set API base URL in environment variables
   - Configure authentication credentials
   - Test connection via `/health` endpoint

## API Endpoints

### Calls
- `GET /api/calls/live` - Get active calls
- `GET /api/calls/` - Get call history (paginated)
- `GET /api/calls/stats` - Get call statistics
- `POST /api/calls/` - Create call record
- `PUT /api/calls/{id}` - Update call
- `POST /api/calls/{id}/hangup` - Hangup call via 3CX
- `POST /api/calls/{id}/hold` - Put call on hold
- `POST /api/calls/make-call` - Initiate new call

### Agents
- `GET /api/agents/` - Get agents list
- `GET /api/agents/{id}` - Get agent details
- `POST /api/agents/` - Create agent
- `PUT /api/agents/{id}` - Update agent
- `PUT /api/agents/{id}/status` - Update agent status
- `GET /api/agents/{id}/performance` - Get agent performance metrics

### Leads
- `GET /api/leads/` - Get leads list
- `POST /api/leads/` - Create lead
- `PUT /api/leads/{id}` - Update lead
- `GET /api/leads/{id}/calls` - Get lead call history

### Dashboard
- `GET /api/dashboard/stats` - Get dashboard statistics
- `GET /api/dashboard/live-metrics` - Get real-time metrics

## WebSocket Events

Connect to `/ws/{client_id}` for real-time updates:

### Subscription Types
- `calls` - Call status updates
- `agents` - Agent status changes
- `queues` - Queue statistics
- `system` - System alerts

### Message Format
```json
{
  "type": "call_update",
  "data": {
    "id": "call-uuid",
    "status": "answered",
    "agent_name": "John Doe"
  },
  "timestamp": "2024-01-01T12:00:00Z"
}
```

## Data Models

### Call
- Call tracking with 3CX integration
- Status management (ringing, answered, on hold, ended)
- Duration tracking and statistics
- Recording management
- Agent and queue assignment

### Agent
- Extension and contact information
- Real-time status tracking
- Performance metrics (daily and all-time)
- Queue assignments and skills
- Login/logout tracking

### Lead
- Customer information and contact details
- Lead scoring and qualification status
- Call history and follow-up scheduling
- Campaign tracking and source attribution

## Development

### Project Structure
```
call-center-api/
├── api/
│   ├── routes/          # API route handlers
│   ├── threecx_client.py # 3CX API integration
│   └── websocket.py     # WebSocket management
├── models/              # SQLAlchemy models
├── schemas/             # Pydantic schemas
├── crud/                # Database operations
├── main.py              # FastAPI application
├── requirements.txt     # Python dependencies
└── docker-compose.yml   # Docker configuration
```

### Running Tests
```bash
pytest
```

### Code Formatting
```bash
black .
isort .
flake8 .
```

## Deployment

### Production Deployment

1. **Environment Setup**
   - Set production environment variables
   - Configure SSL certificates
   - Set up reverse proxy (nginx)

2. **Database Migration**
   - Run database migrations
   - Set up database backups

3. **Monitoring**
   - Configure logging
   - Set up health checks
   - Monitor performance metrics

### Scaling Considerations

- **Horizontal Scaling**: Multiple API instances behind load balancer
- **Database**: Read replicas for analytics queries
- **Caching**: Redis for session management and caching
- **Background Tasks**: Separate Celery workers for heavy operations

## Monitoring and Logging

### Health Checks
- `/health` - Basic health check
- `/health/detailed` - Detailed system status
- Database connectivity check
- 3CX API connectivity check

### Metrics
- Call volume and duration metrics
- Agent performance tracking
- System resource utilization
- API response times

## Security

### Authentication
- JWT-based authentication
- Role-based access control
- API key authentication for integrations

### Data Protection
- Encrypted database connections
- Secure API communication
- PII data handling compliance
- Audit logging

## Support

### Common Issues

1. **3CX Connection Failed**
   - Check network connectivity
   - Verify API credentials
   - Ensure 3CX API is enabled

2. **Database Connection Issues**
   - Verify PostgreSQL is running
   - Check connection string
   - Ensure database exists

3. **WebSocket Connection Problems**
   - Check firewall settings
   - Verify WebSocket support
   - Monitor connection limits

### Getting Help
- Check API documentation at `/docs`
- Review logs for error details
- Verify environment configuration

## License

This project is licensed under the MIT License - see the LICENSE file for details.
