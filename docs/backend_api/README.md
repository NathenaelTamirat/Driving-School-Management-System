# Driving School Management System — Backend API

**Stack:** Ruby on Rails 8.1 (API-only), PostgreSQL, Puma  
**Base URL:** `http://localhost:3001`  
**CORS:** Allows `http://localhost:3000` (Next.js dev server) with all standard HTTP methods.

---

## Endpoints

### Health Check

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/up` | Returns `200 OK` if the app is live |

---

### Authentication

| Method | Path | Description | Auth Required |
|--------|------|-------------|---------------|
| `POST` | `/api/v1/auth/login` | Log in with email/password, returns JWT | No |
| `POST` | `/api/v1/auth/register` | Self-register as `student` role, returns JWT | No |
| `DELETE` | `/api/v1/auth/logout` | Log out (token added to denylist) | Yes |
| `GET` | `/api/v1/auth/me` | Get current authenticated user's profile | Yes |

**Auth Required** endpoints must include an `Authorization: Bearer <token>` header. Responses from auth-required endpoints use a standardized envelope:

```json
{
  "success": true,
  "data": { ... },
  "message": "Login successful"
}
```

On error:
```json
{
  "success": false,
  "error": {
    "message": "Invalid email or password",
    "code": "INVALID_CREDENTIALS"
  }
}
```

#### `POST /api/v1/auth/login`

**Parameters (`auth`):**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `auth[email]` | string | yes | User's email |
| `auth[password]` | string | yes | User's password |

**Response `200 OK`:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": 1,
      "email": "john@example.com",
      "full_name": "John Doe",
      "role": "student",
      "phone_number": "+251911111111",
      "is_qualified_instructor": false,
      "created_at": "2026-06-25T10:00:00Z"
    },
    "token": "eyJhbGciOiJIUzI1NiJ9..."
  },
  "message": "Login successful"
}
```

**Response `401 Unauthorized`:**
```json
{
  "success": false,
  "error": { "message": "Invalid email or password", "code": "INVALID_CREDENTIALS" }
}
```

#### `POST /api/v1/auth/register`

**Parameters (`auth`):**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `auth[email]` | string | yes | User's email |
| `auth[password]` | string | yes | Min 6 chars |
| `auth[password_confirmation]` | string | yes | Must match password |
| `auth[full_name]` | string | yes | Full name |
| `auth[phone_number]` | string | no | Phone number |

**Response `201 Created`:**
```json
{
  "success": true,
  "data": {
    "user": { "id": 1, "email": "john@example.com", "full_name": "John Doe", "role": "student", "phone_number": null, "is_qualified_instructor": false, "created_at": "2026-06-25T10:00:00Z" },
    "token": "eyJhbGciOiJIUzI1NiJ9..."
  },
  "message": "Registration successful"
}
```

**Response `422 Unprocessable Entity`:**
```json
{
  "success": false,
  "error": {
    "message": "Registration failed",
    "code": "REGISTRATION_FAILED",
    "details": { "email": ["has already been taken"], "password": ["is too short (minimum is 6 characters)"] }
  }
}
```

#### `DELETE /api/v1/auth/logout`

Requires `Authorization: Bearer <token>` header. No request body needed.

**Response `200 OK`:**
```json
{
  "success": true,
  "data": {},
  "message": "Logout successful"
}
```

#### `GET /api/v1/auth/me`

Requires `Authorization: Bearer <token>` header.

**Response `200 OK`:**
```json
{
  "success": true,
  "data": {
    "user": { "id": 1, "email": "john@example.com", "full_name": "John Doe", "role": "student", "phone_number": "+251911111111", "is_qualified_instructor": false, "created_at": "2026-06-25T10:00:00Z" }
  },
  "message": "Current user retrieved"
}
```

---

### Users (Admin-managed)

| Method | Path | Description | Auth Required |
|--------|------|-------------|---------------|
| `GET` | `/api/v1/users` | List all users (admin only) | Yes |
| `GET` | `/api/v1/users/:id` | Show a user (admin or self) | Yes |
| `POST` | `/api/v1/users` | Create a user with any role (admin only) | Yes |
| `PATCH` | `/api/v1/users/:id` | Update a user (admin or self) | Yes |
| `DELETE` | `/api/v1/users/:id` | Delete a user (admin only, cannot delete self) | Yes |

All Users endpoints require `Authorization: Bearer <token>` header and admin role (except show/update for own profile).

#### `POST /api/v1/users` — Create User

**Parameters (`user`):**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `user[email]` | string | yes | User's email |
| `user[password]` | string | yes | Min 6 chars |
| `user[password_confirmation]` | string | yes | Must match password |
| `user[full_name]` | string | yes | Full name |
| `user[role]` | string | yes | One of: `admin`, `instructor`, `clerk`, `student` |
| `user[phone_number]` | string | no | Phone number |
| `user[instructor_license_number]` | string | no | Required if role is `instructor` |
| `user[instructor_category]` | string | no | Instructor's category |
| `user[years_experience]` | integer | no | >= 0 |
| `user[is_qualified_instructor]` | boolean | no | Default: `false` |

**Response `201 Created`:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "email": "instructor@example.com",
    "full_name": "Jane Instructor",
    "role": "instructor",
    "phone_number": "+251911111111",
    "is_qualified_instructor": true,
    "created_at": "2026-06-25T10:00:00Z"
  },
  "message": "User created"
}
```

#### `PATCH /api/v1/users/:id` — Update User

Same parameters as create (partial update allowed). Use `PATCH`.

**Response `200 OK`:**
```json
{
  "success": true,
  "data": { "id": 1, "email": "updated@example.com", ... },
  "message": "User updated"
}
```

#### `DELETE /api/v1/users/:id`

**Response `200 OK`:**
```json
{
  "success": true,
  "data": {},
  "message": "User deleted"
}
```

---

### Batches

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/v1/batches` | List all batches |
| `GET` | `/api/v1/batches/:id` | Show a single batch |
| `POST` | `/api/v1/batches` | Create a new batch |

#### `GET /api/v1/batches`

**Response `200 OK`:**
```json
[
  {
    "id": 1,
    "name": "Batch A",
    "status": "pending",
    "submitted_at": null,
    "approved_at": null,
    "rejection_reason": null,
    "created_at": "2026-06-25T10:00:00Z",
    "updated_at": "2026-06-25T10:00:00Z"
  }
]
```

#### `GET /api/v1/batches/:id`

**Response `200 OK`:**
```json
{
  "id": 1,
  "name": "Batch A",
  "status": "pending",
  "submitted_at": null,
  "approved_at": null,
  "rejection_reason": null,
  "created_at": "2026-06-25T10:00:00Z",
  "updated_at": "2026-06-25T10:00:00Z"
}
```

#### `POST /api/v1/batches`

**Parameters (`batch`):**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `batch[name]` | string | yes | Batch name |
| `batch[status]` | string | no | One of: `pending`, `submitted`, `approved`, `rejected` (default: `pending`) |

**Response `201 Created`:**
```json
{
  "id": 2,
  "name": "Batch B",
  "status": "pending",
  "submitted_at": null,
  "approved_at": null,
  "rejection_reason": null,
  "created_at": "2026-06-25T12:00:00Z",
  "updated_at": "2026-06-25T12:00:00Z"
}
```

**Response `422 Unprocessable Entity`:**
```json
{
  "errors": ["Name can't be blank", "Name has already been taken"]
}
```

**Batch statuses:** `pending`, `submitted`, `approved`, `rejected`

---

### License Categories

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/v1/license_categories` | List all license categories |

**Response `200 OK`:**
```json
[
  {
    "id": 1,
    "name": "Category A"
  }
]
```

---

### Students

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/v1/students` | List all students |
| `GET` | `/api/v1/students/:id` | Show a single student |
| `POST` | `/api/v1/students` | Create a new student (multipart/form-data) |

#### `POST /api/v1/students` — Create Student

**Content-Type:** `multipart/form-data`

**Parameters:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `student[batch_id]` | integer | yes | Batch the student belongs to |
| `student[student_id]` | string | yes | Unique student identifier |
| `student[document_id]` | string | yes | Unique document identifier |
| `student[first_name]` | string | yes | Max 50 chars |
| `student[middle_name]` | string | yes | Max 50 chars |
| `student[last_name]` | string | yes | Max 50 chars |
| `student[date_of_birth]` | date | yes | ISO 8601 date |
| `student[blood_type]` | string | yes | One of: `A+`, `A-`, `B+`, `B-`, `AB+`, `AB-`, `O+`, `O-` |
| `student[address]` | string | yes | Max 200 chars |
| `student[house_number]` | string | yes | Max 20 chars |
| `student[woreda]` | string | yes | Max 50 chars |
| `student[city]` | string | yes | Max 50 chars |
| `student[kebele]` | string | no | Max 50 chars |
| `student[subcity]` | string | no | Max 50 chars |
| `student[verified]` | boolean | no | Default: `false` |
| `student[verified_at]` | datetime | no | |
| `student[theory_days_completed]` | integer | no | Default: `0`, >= 0 |
| `student[practical_days_completed]` | integer | no | Default: `0`, >= 0 |
| `student[mock_test_score]` | integer | no | Default: `0`, 0–100 |
| `student[profile_photo]` | file | no | Profile photo (Active Storage) |
| `student[yellow_card]` | file | no | Yellow card document |
| `student[grade_8]` | file | no | Grade 8 certificate |
| `student[grade_10]` | file | no | Grade 10 certificate |
| `student[grade_12]` | file | no | Grade 12 certificate |
| `student[medical]` | file | no | Medical certificate |

**Response `201 Created`:**
```json
{
  "id": 1,
  "batch_id": 1,
  "student_id": "STU001",
  "document_id": "DOC001",
  "first_name": "John",
  "middle_name": "Doe",
  "last_name": "Smith",
  "date_of_birth": "2000-01-15",
  "blood_type": "O+",
  "address": "123 Main St",
  "house_number": "H123",
  "kebele": "01",
  "woreda": "02",
  "subcity": "Arada",
  "city": "Addis Ababa",
  "status": "registered",
  "verified": false,
  "verified_at": null,
  "theory_days_completed": 0,
  "practical_days_completed": 0,
  "mock_test_score": 0,
  "under_penalty": false,
  "penalty_start_date": null,
  "penalty_end_date": null,
  "penalty_reason": null,
  "created_at": "2026-06-25T10:00:00Z",
  "updated_at": "2026-06-25T10:00:00Z"
}
```

**Response `422 Unprocessable Entity`:**
```json
{
  "errors": ["First name can't be blank", "Student id has already been taken"]
}
```

---

### Exam Bookings (nested under students)

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/v1/students/:student_id/exam_bookings` | List exam bookings for a student |
| `GET` | `/api/v1/students/:student_id/exam_bookings/:id` | Show a single exam booking |
| `POST` | `/api/v1/students/:student_id/exam_bookings` | Create an exam booking (with eligibility check) |
| `PATCH` | `/api/v1/students/:student_id/exam_bookings/:id` | Update an exam booking |
| `POST` | `/api/v1/students/:student_id/exam_bookings/:id/cancel` | Cancel an exam booking |
| `POST` | `/api/v1/students/:student_id/exam_bookings/:id/record_result` | Record exam result (score) |

#### `GET /api/v1/students/:student_id/exam_bookings`

Returns bookings ordered by `scheduled_date` ascending.

**Response `200 OK`:**
```json
[
  {
    "id": 1,
    "student_id": 1,
    "exam_type": "theory",
    "scheduled_date": "2026-07-01T09:00:00Z",
    "venue": "Exam Hall A",
    "status": "scheduled",
    "score": null,
    "notes": null,
    "completed_at": null,
    "created_at": "2026-06-25T10:00:00Z",
    "updated_at": "2026-06-25T10:00:00Z"
  }
]
```

#### `POST /api/v1/students/:student_id/exam_bookings`

**Parameters:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `exam_booking[exam_type]` | string | yes | `theory` or `practical` |
| `exam_booking[scheduled_date]` | datetime | yes | Must be in the future |
| `exam_booking[venue]` | string | no | Exam location |
| `exam_booking[notes]` | text | no | Additional notes |

**Eligibility validation** runs before creation. The student must:
- Be in `exam_eligible` status
- Have completed 35+ theory days
- Have completed 52+ practical days
- Have mock test score > 37

**Response `403 Forbidden` (eligibility failure):**
```json
{
  "errors": [
    "Student status 'registered' is not eligible for exam booking. Must be 'exam_eligible'",
    "Theory training incomplete: 10/35 days required",
    "Practical training incomplete: 5/52 days required",
    "Mock test score insufficient: 20% (minimum 38% required)"
  ]
}
```

#### `PATCH /api/v1/students/:student_id/exam_bookings/:id`

Same parameters as create (partial update allowed).

#### `POST /api/v1/students/:student_id/exam_bookings/:id/cancel`

Sets status to `cancelled`. No request body needed.

#### `POST /api/v1/students/:student_id/exam_bookings/:id/record_result`

**Parameters:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `exam_booking[score]` | integer | yes | 0–100 |
| `exam_booking[notes]` | text | no | Result notes |

- Sets status to `completed`, records score and `completed_at` timestamp
- **Passing threshold:** score >= 50
- If score < 50, a **7-day penalty** is applied to the student (blocks further bookings)

---

## Data Models

### Batch

| Column | Type | Default | Notes |
|--------|------|---------|-------|
| `id` | integer (PK) | auto | |
| `name` | string | required, unique | |
| `status` | string | `"pending"` | `pending` / `submitted` / `approved` / `rejected` |
| `submitted_at` | datetime | nullable | |
| `approved_at` | datetime | nullable | |
| `rejection_reason` | text | nullable | |
| `created_at` | datetime | auto | |
| `updated_at` | datetime | auto | |

### Student

| Column | Type | Default | Notes |
|--------|------|---------|-------|
| `id` | integer (PK) | auto | |
| `batch_id` | integer (FK) | required | Belongs to Batch |
| `student_id` | string | required, unique | |
| `document_id` | string | required, unique | |
| `first_name` | string | required, max 50 | |
| `middle_name` | string | required, max 50 | |
| `last_name` | string | required, max 50 | |
| `date_of_birth` | date | required | |
| `blood_type` | string | required | `A+`, `A-`, `B+`, `B-`, `AB+`, `AB-`, `O+`, `O-` |
| `address` | string | required, max 200 | |
| `house_number` | string | required, max 20 | |
| `kebele` | string | max 50 | |
| `woreda` | string | required, max 50 | |
| `subcity` | string | max 50 | |
| `city` | string | required, max 50 | |
| `verified` | boolean | `false` | |
| `verified_at` | datetime | nullable | |
| `status` | string | `"registered"` | State machine (see below) |
| `theory_started_at` | datetime | nullable | |
| `practical_started_at` | datetime | nullable | |
| `theory_days_completed` | integer | `0` | >= 0 |
| `practical_days_completed` | integer | `0` | >= 0 |
| `last_attendance_date` | date | nullable | |
| `mock_test_score` | integer | `0` | 0–100 |
| `under_penalty` | boolean | `false` | |
| `penalty_start_date` | datetime | nullable | |
| `penalty_end_date` | datetime | nullable | |
| `penalty_reason` | text | nullable | |
| `created_at` | datetime | auto | |
| `updated_at` | datetime | auto | |

**Attachments (Active Storage):** `profile_photo`, `yellow_card`, `grade_8`, `grade_10`, `grade_12`, `medical`

### ExamBooking

| Column | Type | Default | Notes |
|--------|------|---------|-------|
| `id` | integer (PK) | auto | |
| `student_id` | integer (FK) | required | Belongs to Student |
| `exam_type` | string | required | `theory` or `practical` |
| `scheduled_date` | datetime | required | Must be in future on create |
| `venue` | string | nullable | |
| `status` | string | `"scheduled"` | `scheduled` / `completed` / `cancelled` / `no_show` |
| `score` | integer | nullable | 0–100, required if completed |
| `notes` | text | nullable | |
| `completed_at` | datetime | nullable | |
| `created_at` | datetime | auto | |
| `updated_at` | datetime | auto | |

### LicenseCategory

| Column | Type | Default | Notes |
|--------|------|---------|-------|
| `id` | integer (PK) | auto | |
| `name` | string | required, unique | |
| `created_at` | datetime | auto | |
| `updated_at` | datetime | auto | |

---

## Student State Machine

```
registered ──> theory_in_progress ──> practical_in_progress ──> exam_eligible ──> graduated
```

| Event | From | To | Guard |
|-------|------|----|-------|
| `start_theory` | `registered` | `theory_in_progress` | — |
| `start_practical` | `theory_in_progress` | `practical_in_progress` | `theory_days >= 35` AND `mock_test_score > 37` |
| `make_eligible` | `practical_in_progress` | `exam_eligible` | `practical_days >= 52` |
| `graduate` | `exam_eligible` | `graduated` | — |

---

## Error Responses

| Status | Meaning |
|--------|---------|
| `400` | Missing required parameter — `{ "success": false, "error": { "message": "...", "code": "PARAMETER_MISSING" } }` |
| `401` | Unauthorized / invalid credentials — `{ "success": false, "error": { "message": "...", "code": "INVALID_CREDENTIALS" } }` |
| `403` | Forbidden / eligibility check failed / not authorized |
| `404` | Resource not found — `{ "error": "Student not found" }` or `{ "success": false, "error": { "message": "Resource not found", "code": "NOT_FOUND" } }` |
| `422` | Validation failure — `{ "errors": ["..."] }` or `{ "success": false, "error": { "message": "...", "code": "VALIDATION_ERROR" } }` |

---

## Penalty System

When a student fails an exam (score < 50), a **7-day penalty** is automatically applied:

```json
{
  "under_penalty": true,
  "penalty_start_date": "2026-06-25T10:00:00Z",
  "penalty_end_date": "2026-07-02T10:00:00Z",
  "penalty_reason": "Failed theory exam on 2026-06-25"
}
```

Penalty is considered active when `under_penalty == true`, `penalty_end_date` is in the future, and `penalty_end_date` is present.
