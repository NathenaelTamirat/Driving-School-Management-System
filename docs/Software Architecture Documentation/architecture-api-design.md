# Architecture API Design

## API Architecture and Routing Namespace

The system implements a versioned REST API architectural pattern to ensure backward compatibility and clean segregation of endpoints.

- **Routing Configuration:** All incoming client endpoints are managed within the `config/routes.rb` configuration file inside the `API::V1` namespace.
- **Controller Directory Structure:** Code execution paths are handled by dedicated controllers organized under the `app/controllers/api/v1` folder.
- **Core Client Communication:** The Nextjs frontend consumes these versioned endpoints using an asynchronous HTTP client layer.

## Authentication and Security Protocol

The system enforces strict request validation through token based access controls.

- **Primary Login Route:** Users authenticate by submitting credential payloads to the `POST /api/v1/auth/login` endpoint.
- **Token Issuance Engine:** Credentials verification is orchestrated via Devise combined with the devise jwt extension to issue short lived tokens expiring after 1 hour.
- **Request Authorization Header:** Subsequent interactions require the client to supply the token inside the `Authorization Bearer` header.
- **Session Termination Strategy:** The application processes user logout requests by maintaining a token blacklist to invalidate utilized JSON Web Tokens immediately.

## Standard Request and Response Lifecycle

Every API interaction travels through a predictable execution pipeline across the modular structure.

1. The Nextjs client application dispatches an HTTP request with a valid token attached.
2. The Rails Router intercepts the request and matches it to the corresponding versioned controller.
3. The Pundit authorization layer executes a policy check to verify the role matches permissions.
4. The controller initializes and executes a single purpose domain Service Object.
5. The Service Object processes business calculations and invokes the thin ActiveRecord model layer.
6. The model coordinates execution with the PostgreSQL 16 database instance.
7. The controller formats the database output into a standard JSON payload returned to the client.

## HTTP Status Codes Protocol

The API relies on specific HTTP status codes to communicate execution outcomes uniformly.

- **200 Success:** Returned when a standard request completes successfully.
- **201 Created:** Emitted immediately following successful resource generation.
- **400 Bad Request:** Triggered when basic parameter validation fails.
- **401 Unauthorized:** Produced when the token is missing or has expired.
- **403 Forbidden:** Occurs when a user possesses insufficient role permissions under Role Based Access Control.
- **404 Not Found:** Dispatched when a requested record is completely absent from the database.
- **422 Unprocessable Entity:** Reserved for business logic and regulatory rule violations such as failing training eligibility thresholds.
- **500 Internal Server Error:** Generated when an unhandled code exception occurs within the server.

## Unified Error Response Structure

When an operation fails or encounters a business rule block the API returns a structured JSON wrapper rather than a generic message.

- **Error Code Attribute:** A uppercase string identifier indicating the exact nature of the failure such as `ELIGIBILITY_FAILURE`.
- **Error Message Attribute:** A readable description clarifying the cause of the processing stop.
- **Error Details Block:** An embedded key value hash containing numeric parameters and rule metrics to help the frontend render targeted user feedback.
