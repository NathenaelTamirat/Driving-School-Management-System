# Architecture Component Diagram Documentation

## System Components Overview

The system is divided into three primary components handling specific responsibilities. The backend component manages logic and data. The frontend component manages the user interface. The database component manages persistent storage.

## Backend Component

- **Technology:** Ruby on Rails API
- **Core Responsibilities:** Provides REST API endpoints for the frontend. Manages JSON Web Token authentication using Devise. Encapsulates business logic within service objects instead of fat models. Processes background jobs using ActiveJob. Manages database access through ActiveRecord.
- **Internal Structure:** Contains versioned REST controllers, thin ActiveRecord models, domain service modules, background jobs, Pundit authorization policies, and mailers for notifications.

## Frontend Component

- **Technology:** Next.js
- **Core Responsibilities:** Delivers the user interface for Admin, Instructor, Clerk, and Student roles. Consumes the backend API. Manages client side routing, state management, and user experience flows.
- **Internal Structure:** Built using the Next.js App Router, reusable UI components, API client utilities, custom React hooks, and static assets.

## Database Component

- **Technology:** PostgreSQL 16
- **Core Responsibilities:** Provides persistent data storage. Ensures relational integrity via foreign keys. Supports database transactions for financial operations. Uses JSONB columns for flexible metadata.
- **Key Tables:** Stores data across specific tables including users, students, batches, attendance logs, invoices, courses, mock tests, erta exam bookings, license upgrades, payroll entries, graduation records, and renewal requests.

## Service Layer Components

The backend encapsulates business logic into specific service module components to prevent fat models and ensure single responsibility.

- **Meklit Module Component:** Executes batch export logic and qualification validation.
- **LMS Module Component:** Drives the theory and practical training engines alongside attendance locking.
- **ERTA Engine Module Component:** Contains the Eligibility Validator, Penalty Engine, and Scheduler for official exams.
- **Finance Module Component:** Calculates milestone tracking, pricing logic, and monthly payroll.
- **Masadeg Module Component:** Governs progression logic and verifies active license lifespans for driver upgrades.
- **Graduation Module Component:** Compiles physical and digital dossiers and executes file transfers to Kifle Ketema.
