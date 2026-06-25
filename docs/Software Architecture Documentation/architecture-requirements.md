# Architecture Requirements

## Functional Requirements

The system must fulfill specific domain rules separated into core service modules based on the provided architecture document.

### Student Lifecycle and Domain Rules

- The system must track student state transitions through Registration, Meklit Batch, ERTA Approval, LMS Training, Mock Tests, ERTA Exam Booking, and Graduation or Penalty.
- The Meklit module must manage batch export logic, validate qualifications, and handle 15 day cycle management.
- The LMS module must trigger mock tests, lock daily attendance, and operate theory and practical training engines.
- The ERTA Engine must validate 35 day and 52 day eligibility rules.
- The ERTA Engine must enforce a penalty system requiring 300 ETB and a 5 day remedial training upon exam failure.
- The Finance module must track milestone 1 and 2 payments.
- The Finance module must calculate monthly payroll including base salary and student load bonuses.
- The Graduation module must compile physical and digital dossiers and handle file transfers to Kifle Ketema.

### Authorization and Roles

- The system must support Role Based Access Control.
- Admins must have full system access.
- Instructors must have access to training logs, mock tests, and their own payroll.
- Clerks must handle student registration, payments, and exam booking.
- Students must have read only access to their own records.

### Automated Background Processes

- The system must run a scheduled job every 15 days to sweep pending students and generate batch export payloads.
- The system must run a daily monitor to check 35 day and 52 day training completion and flag students approaching deadlines.
- The system must generate penalty invoices and lock exam bookings until paid.
- The system must compute payroll monthly.
- The system must trigger dossier compilation upon graduation.

## Non Functional Requirements

### Performance and Scalability

- The system must support an initial target load of 50 to 200 students per year.
- The system must handle up to 50 concurrent users on a single server.
- The architecture must permit future horizontal scaling via load balancers and database read replicas.

### Security

- The system must authenticate users via JSON Web Tokens with a short lived expiration of 1 hour.
- The system must implement token blacklisting upon user logout.
- The database must utilize encrypted SSL connections and parameterized queries to prevent SQL injection.
- The system must restrict Cross Origin Resource Sharing to the authorized frontend origin only.
- Sensitive data must be stored using environment variables and no credentials shall be stored in version control.
- The database must use encryption at rest.

### Data Persistence

- The system must utilize a PostgreSQL 16 database for persistent data storage.
- The system must maintain relational integrity via foreign keys and transaction support for financial operations.
- The database must use JSONB columns for flexible metadata storage.
