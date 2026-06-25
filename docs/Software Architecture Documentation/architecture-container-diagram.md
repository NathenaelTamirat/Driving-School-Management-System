# Architecture Container Diagram Documentation

## Container Architecture Overview

The system is deployed using a containerized environment managed by a docker compose configuration. The deployment consists of exactly three interconnected containers representing the database, the backend api, and the frontend user interface.

## Frontend Container

- **Name:** nextjs frontend
- **Technology Stack:** Next.js
- **Network Configuration:** Port 3000 mapped to Port 3000
- **Environment Setup:** Utilizes the `NEXT_PUBLIC_API_URL` variable to connect to the backend
- **Core Responsibilities:** Delivers the user interface for all system roles including Admin, Instructor, Clerk, and Student. Manages client side routing, state management, form validation, and consumes the REST API.

## Backend Container

- **Name:** rails api
- **Technology Stack:** Ruby on Rails
- **Network Configuration:** Port 8080 mapped to 8080 or 3000 internally
- **Dependencies:** Strictly depends on the database container running first
- **Core Responsibilities:** Exposes versioned REST API endpoints for the frontend. Handles authentication using Devise and devise jwt. Encapsulates business logic within service objects across five domain modules. Processes background jobs via ActiveJob and manages the database access layer via ActiveRecord.

## Database Container

- **Name:** postgres
- **Technology Stack:** PostgreSQL 16
- **Network Configuration:** Port 5432
- **Persistence Strategy:** Implements local file based persistence by mounting a volume at the local directory `backend/db/data/` to ensure self contained project storage and easy backups.
- **Core Responsibilities:** Stores persistent data across 12 specific tables. Enforces relational integrity through foreign keys and supports database transactions for financial operations. Allows flexible metadata storage via JSONB columns.

## Container Interactions and Data Flow

The client running the Next.js frontend initiates an HTTP Request that includes a JSON Web Token in the header. The request reaches the Rails API container where it passes through the router to a versioned controller. After the Pundit authorization check, the service object executes the business logic and triggers an ActiveRecord model. The model sends a database query to the PostgreSQL container. The PostgreSQL container returns the requested data to the Rails container, which finally formats a JSON response and sends it back to the frontend container.
