# Software System Design

## System Architecture Overview

The Driving School Automation System utilizes a Modular Monolith architecture pattern. This design couples a Ruby on Rails backend API with a Next.js frontend application and a PostgreSQL 16 database. Domain logic is organized into distinct service modules with clear functional boundaries while maintaining a single deployment unit to avoid distributed system complexity.

## Architectural Rationale

### Advantages

**Simplicity:** The system uses a single deployment unit which eliminates distributed system complexity.

**Developer Experience:** Local development and debugging processes are simplified.

**Clear Boundaries:** Domain modules are logically separated within the codebase directory structure.

**Future Proofing:** Code modules are structurally isolated and can be extracted into independent microservices later if capacity demands grow.

**Performance:** The single unit architecture completely eliminates network latency between separate domain modules.

### Trade-offs

- The architecture requires strict development discipline to maintain clean module boundaries.
- All modules scale together as a single unit rather than scaling independently.
- The architecture presents a single point of failure which is mitigated by using database replicas.

## Core System Components

### 1. Backend API (Ruby on Rails)

The backend handles the core business logic, data persistence, and system automation.

**Responsibilities:** Serves a versioned REST API for frontend consumption, enforces JWT-based authentication, contains business logic in dedicated service objects, manages background job processing via ActiveJob, and handles database access through ActiveRecord.

**Directory Structure:**

```
backend/
├── app/
│   ├── controllers/api/v1/
│   ├── models/
│   ├── services/
│   ├── jobs/
│   ├── policies/
│   └── mailers/
├── config/
│   ├── routes.rb
│   ├── database.yml
│   └── initializers/
└── db/
    ├── migrate/
    └── data/
```

### 2. Frontend Application (Next.js)

The frontend delivers the user interface tailored for all roles including Administrators, Instructors, Clerks, and Students.

**Responsibilities:** Renders user interfaces, consumes the backend REST API via an HTTP client, manages client-side routing, handles application state, and executes form validation and user experience flows.

**Directory Structure:**

```
frontend/
├── src/
│   ├── app/
│   ├── components/
│   ├── lib/
│   └── hooks/
└── public/
```

### 3. Database Engine (PostgreSQL 16)

The database provides relational data storage and integrity.

**Responsibilities:** Ensures persistent data storage, enforces relational integrity via foreign keys, handles transaction safety for financial operations, and utilizes JSONB columns for metadata flexibility.

## Data Flow Architecture

### Student Lifecycle Flow

1. **Registration:** Student onboarding and initial data intake occur at the clerk interface.
2. **Meklit Batch:** Profiles are queued into the 15-day synchronization cycle.
3. **ERTA Approval:** Receipt of regulatory clearance transitions the profile status.
4. **LMS Training:** Completion of mandatory theoretical and practical training logs is enforced.
5. **Mock Tests:** Passing the internal school screening test unlocks subsequent steps.
6. **Exam Eligibility Check:** Validation of statutory training clocks occurs.
7. **ERTA Exam Booking:** Allocation of official testing dates via the government-issued n-number.
8. **Exam Result:** Logging official performance outcomes determines the next transition.
9. **Conditional Branching:** If the student passes, they proceed directly to Graduation. If the student fails, they trigger the Penalty and Remedial engine before returning to the mock test stage.
10. **Graduation:** Completion of the driving school training track.
11. **Dossier Transfer:** Delivery of physical and digital records to Kifle Ketema based on residential sub-city registration.

### API Request Execution Flow

1. The Next.js client sends an HTTP request containing a JWT in the authorization header.
2. The Rails Router intercepts the request and matches it to a versioned API::V1 controller.
3. The API controller passes control to Pundit for a Role-Based Access Control check.
4. The designated Service Object executes the isolated business logic.
5. The ActiveRecord Model runs database queries against PostgreSQL.
6. PostgreSQL returns records to the model layer.
7. The controller converts data into JSON and returns it to the client.

## Deployment and Infrastructure

The system uses Docker Compose to coordinate three localized containers for development and production.

### Container Definitions

**postgres:** Runs PostgreSQL 16 on port 5432 with local file-based persistence mapped to the directory `./backend/db/data/`.

**rails-api:** Runs the Ruby on Rails API framework on port 8080. It depends directly on the postgres container and loads core gems such as pg, devise, devise-jwt, and rack-cors.

**nextjs-frontend:** Runs the Next.js application framework on port 3000 and points to the backend using the environment variable `NEXT_PUBLIC_API_URL=http://rails-api:8080`.

## Scalability Architecture

**Phase 1 Target:** Designed to support an operational load of 50 to 200 students per year with fewer than 50 concurrent users on a single server setup.

**Phase 2 Scaling Options:** Incorporates load balancers in front of Rails instances, PostgreSQL read replicas, Redis deployment to replace DelayedJob with Sidekiq, vertical container resource scaling, and eventual extraction of intensive modules into independent microservices.

## Security Architecture

**JWT Token Security:** Enforces short-lived access tokens limited to 1 hour alongside a secure secret key and token blacklisting on logout.

**Database Security:** Utilizes encrypted connections, parameterized queries to prevent SQL injection, and role-based database access users.

**CORS Configuration:** Whitelists only the designated Next.js origin and restricts unapproved HTTP methods.

**Input Validation:** Enforces Rails strong parameters, model-level validations, and strict data sanitization.

**Sensitive Data:** Manages all secrets via environment variables and ensures database encryption at rest.
