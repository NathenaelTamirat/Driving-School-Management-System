# Architecture Security Documentation

## Authentication Architecture

The application implements a centralized authentication mechanism to verify user identities and secure communication channels.

- **Login Endpoint:** Users authenticate by sending credentials to the `POST /api/v1/auth/login` endpoint.
- **Framework Stack:** Authentication is managed by Devise integrated with the devise jwt library.
- **Token Lifespan:** Successful authentication issues a JSON Web Token that features a short lived expiration limit of exactly 1 hour.
- **Token Transmission:** The client application must provide this token inside the `Authorization Bearer` header for all subsequent API calls.
- **Logout Handling:** The backend processes logout operations by using a token blacklist to instantly invalidate utilized tokens.

## Authorization and Role Based Access Control

The system governs resource access permissions through explicit role mappings enforced at the server layer.

- **Policy Framework:** Enforced using Pundit policies to evaluate permissions before executing controller actions.
- **Admin Role:** Grants comprehensive system access to manage all modules, data schemas, and administrative tools.
- **Instructor Role:** Limits access to creating training logs, triggering student mock tests, and viewing personal monthly payroll entries.
- **Clerk Role:** Restricts capabilities to handling student registration, processing invoice payments, and orchestrating official exam bookings.
- **Student Role:** Provides strict read only access allowing individuals to monitor personal logs, test marks, and graduation status.

## Database Security Protocols

Data protection is maintained across both transmission paths and physical storage layers.

- **Connection Encryption:** The application enforces encrypted SSL connections for all communication traffic between the Rails API and the database.
- **Protection From Injection:** The system executes database interactions using parameterized queries via ActiveRecord to entirely prevent SQL injection attacks.
- **Encryption At Rest:** The underlying PostgreSQL 16 database storage volume is fully encrypted to safeguard physical data blocks.
- **Database Access Control:** Employs specific role based database users to restrict internal access permissions and isolate queries.

## Network and Application Security Gates

Boundary defenses prevent unauthorized origins and malicious payloads from interacting with the backend API.

- **Cross Origin Resource Sharing:** The backend whitelists the authorized Next.js frontend origin exclusively while systematically blocking unauthorized domains.
- **Method Restrictions:** CORS rules restrict accepted HTTP methods to permitted operational requests.
- **Request Validation:** Employs Rails strong parameters at the controller layer combined with comprehensive model validations to filter incoming parameters.
- **Input Sanitization:** All user inputted text strings pass through sanitization filters before database persistence to eliminate cross site scripting attempts.
- **Secure Response Headers:** The API configuration applies secure headers to protect client browsers from malicious execution.

## Secret Management and Environment Integrity

Sensitive configuration details are isolated from the application codebase to maintain architectural integrity.

- **Credential Isolation:** All secret keys, token signatures, database passwords, and system credentials are stored exclusively inside system environment variables.
- **Version Control Safeguards:** No credentials, certificates, or secrets are permitted within the repository or version control files.
- **Production Isolation:** Separate secret tokens are maintained across development and production environments to prevent cross environment security breaches.
