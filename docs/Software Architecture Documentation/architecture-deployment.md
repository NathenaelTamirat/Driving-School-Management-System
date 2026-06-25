# Architecture Deployment Documentation

## Infrastructure and Docker Setup

The system is deployed using a Docker setup coordinated by a docker compose configuration file. The deployment architecture consists of exactly three containers.

### PostgreSQL Container

- **Name:** postgres
- **Technology:** PostgreSQL 16
- **Port Configuration:** 5432
- **Storage:** Uses a local file based persistence strategy with the data volume mounted at the local directory `backend/db/data/`

### Rails API Container

- **Name:** rails api
- **Technology:** Ruby on Rails
- **Dependency:** Strictly depends on the postgres container running first
- **Port Configuration:** Port 8080 mapped to 8080 or 3000 internally
- **Environment:** Supports development and production environments
- **Required Gems:** pg, devise, devise jwt, and rack cors

### Nextjs Frontend Container

- **Name:** nextjs frontend
- **Technology:** Next.js
- **Port Configuration:** Port 3000 mapped to 3000
- **Environment Variables:** Requires `NEXT_PUBLIC_API_URL` set to `http://rails-api:8080`

## Database Persistence Strategy

The deployment employs a local file based persistence strategy for the database.

- **Data Directory:** The PostgreSQL data is stored locally at `backend/db/data/`
- **Self Contained:** Creates a self contained project environment
- **Backups:** Enables easy backups by simply copying the folder
- **Dependencies:** Removes the need for external volume dependencies
- **Security:** The directory is git ignored for security purposes

## Scalability and Load Management

The current Phase 1 deployment design is sized for specific targets.

- **Target Load:** Accommodates 50 to 200 students per year
- **Concurrent Users:** Supports fewer than 50 concurrent users
- **Infrastructure Size:** A single server is entirely sufficient for the target market

## Future Scaling Options

The deployment architecture allows for future scaling if needed.

- **Horizontal Scaling:** Can be achieved by placing a load balancer in front of Rails instances, adding PostgreSQL read replicas, and implementing Redis for the job queue to replace DelayedJob with Sidekiq
- **Vertical Scaling:** Can be achieved by increasing container resources such as CPU and RAM alongside PostgreSQL tuning for connection pooling and indexes
- **Module Extraction:** High load modules such as the LMS can be extracted to microservices using a message queue like RabbitMQ or Kafka for inter service communication
