# Production Readiness Report
## Driving School Management System

**Generated:** 2026-06-26  
**Codebase snapshot:** `codebundle.md` (232 files, generated 2026-06-26T06:46:22)  
**Analyst:** Senior Software Engineer & DevOps Specialist

---

## Table of Contents

1. [Technology & Architecture Overview](#1-technology--architecture-overview)
2. [Inspection Scorecard](#2-inspection-scorecard)
3. [1 · Critical Security Issues](#3-critical-security-issues)
4. [2 · Reliability & Stability](#4-reliability--stability)
5. [3 · Configuration & Environment Hardening](#5-configuration--environment-hardening)
6. [4 · Performance Optimizations](#6-performance-optimizations)
7. [5 · Testing Gaps](#7-testing-gaps)
8. [6 · CI/CD & Operational Readiness](#8-cicd--operational-readiness)
9. [7 · Documentation Deficiencies](#9-documentation-deficiencies)
10. [8 · Code Quality & Maintainability](#10-code-quality--maintainability)
11. [What Passes](#11-what-passes)

---

## 1. Technology & Architecture Overview

| Layer | Technology |
|---|---|
| **Backend** | Ruby 4.0.1 · Rails 8.1.3 (API-only mode) |
| **Database** | PostgreSQL 16 |
| **Background Jobs** | Solid Queue (in-process via Puma plugin) |
| **Caching** | Solid Cache (PostgreSQL-backed) |
| **Auth** | Devise 5.0.4 + devise-jwt 0.13.0 (Denylist strategy) |
| **Authorization** | Pundit |
| **External API** | HTTParty → ERTA / Meklit government API |
| **Frontend** | Next.js 15 (TypeScript), shadcn/ui, Tailwind CSS |
| **Deployment** | Kamal 2.11.0 + Docker (multi-stage production image) |
| **CI/CD** | GitHub Actions (two separate workflow files) |

**Structure:** Backend-frontend monorepo split into `backend/` (Rails API) and `Client/` (Next.js). Single-server deployment via Kamal/Docker Compose. No microservices.

**Entry points:**
- HTTP API: Puma → Rails router → `api/v1/*`
- Background jobs: Solid Queue supervisor inside Puma (`SOLID_QUEUE_IN_PUMA=1`)
- Health check: `GET /up`
- Scheduled jobs: `config/recurring.yml` (SolidQueue job cleanup only)

**Domain:** Ethiopian driving-school management — student enrolment, LMS attendance, mock tests, exam booking, ERTA/government batch submission, graduation, invoicing, payroll. Tightly coupled to Ethiopian Road Transport Authority (ERTA) regulatory rules.

---

## 2. Inspection Scorecard

| Area | Status |
|---|---|
| Password hashing (bcrypt via Devise) | ✅ OK |
| JWT authentication | ✅ OK (Denylist strategy) |
| API authorization (Pundit) | ⚠️ Needs Improvement — only `UsersController` enforces it; students/batches/exams are unprotected |
| Input validation (strong parameters, model validations) | ✅ OK |
| CSRF/XSS protection | ✅ OK (API-only; CSRF not applicable) |
| SQL injection prevention (ActiveRecord ORM) | ✅ OK |
| HTTPS enforcement | ❌ Missing — `force_ssl` commented out in `production.rb` |
| Secrets management | ⚠️ Needs Improvement — JWT secret has good fallback; MEKLIT_API_KEY in env is good but missing from `.env.example` |
| CORS | ❌ Missing — wildcard `origins "*"` |
| Host header protection | ❌ Missing — `config.hosts` commented out in `production.rb` |
| Dependency vulnerability scanning | ✅ OK (bundler-audit + brakeman in CI) |
| Error handling | ⚠️ Needs Improvement — `BaseController` controllers handled; non-BaseController ones return raw 500 on unhandled exceptions |
| Database connection pooling | ✅ OK (Puma + ActiveRecord pool) |
| Graceful shutdown | ✅ OK (Puma handles SIGTERM) |
| Health check endpoint | ✅ OK (`/up`) |
| Retries for transient failures | ⚠️ Needs Improvement — Redis-based retry counter silently broken |
| Structured logging | ✅ OK (tagged logging with request_id in production) |
| Metrics / alerting | ❌ Missing — no Prometheus, no APM |
| Centralised error tracking | ❌ Missing — no Sentry/Bugsnag |
| DB indexes | ✅ OK for critical paths |
| Pagination | ❌ Missing on `students` and `batches` |
| Caching strategies | ⚠️ Needs Improvement — Solid Cache configured but unused |
| Environment variables (no hard-coded values) | ⚠️ Needs Improvement — several placeholders remain |
| Unit tests (models, services) | ✅ OK (good coverage) |
| Integration/request tests | ⚠️ Needs Improvement — 4 controllers untested |
| Frontend tests | ❌ Missing — zero test infrastructure |
| CI runs tests automatically | ⚠️ Needs Improvement — backend's own CI runs minitest, not RSpec |
| Reproducible builds | ⚠️ Needs Improvement — `package-lock=false` in `.npmrc` |
| Docker image | ✅ OK (multi-stage, non-root user) |
| Database migration in CI | ✅ OK |
| Zero-downtime deployment | ✅ OK (Kamal rolling deploy) |
| README / setup docs | ✅ OK |
| OpenAPI / Swagger spec | ❌ Missing |
| Architecture diagram | ❌ Missing |
| License file | ⚠️ README says MIT; LICENSE file may not exist |

---

## 3. Critical Security Issues

### SEC-1 · CORS wildcard allows any origin to call the API
🔴 **Critical** · `backend/config/initializers/cors.rb:5`

```ruby
# CURRENT — dangerous
origins "*"
resource "*", headers: :any, methods: [ :get, :post, :put, :patch, :delete, :options, :head ]
```

**Risk:** Any website can make authenticated cross-origin requests on behalf of a logged-in user. For a government-adjacent system handling personal data this is unacceptable.

**Fix:**
```ruby
Rails.application.config.middleware.insert_before 0, Rack::Cors do
  allow do
    # List every allowed origin explicitly.
    origins ENV.fetch("ALLOWED_ORIGINS", "http://localhost:3000").split(",")

    resource "/api/*",
      headers: :any,
      methods: [ :get, :post, :put, :patch, :delete, :options, :head ],
      credentials: true,
      max_age: 86400
  end
end
```

Add `ALLOWED_ORIGINS=https://yourdomain.com` to the production environment.

---

### SEC-2 · Four core controllers have NO authentication — the entire student/exam workflow is public
🔴 **Critical** · Multiple files

`StudentsController`, `BatchesController`, `ExamBookingsController`, and `LicenseCategoriesController` all inherit from `ApplicationController`, **not** `BaseController`. `BaseController` is the only class that calls `before_action :authenticate_user!`. This means:

- Anyone on the internet can enumerate all students: `GET /api/v1/students`
- Anyone can create, view, or modify student records
- Anyone can create, cancel, or record results for exam bookings (including applying penalties)
- Anyone can read or create batches

**Affected files:**
- `backend/app/controllers/api/v1/students_controller.rb:9` — `class StudentsController < ApplicationController`
- `backend/app/controllers/api/v1/batches_controller.rb:11` — `class BatchesController < ApplicationController`
- `backend/app/controllers/api/v1/exam_bookings_controller.rb:9` — `class ExamBookingsController < ApplicationController`
- `backend/app/controllers/api/v1/license_categories_controller.rb:9` — `class LicenseCategoriesController < ApplicationController`

The frontend `api.ts` confirms this — not a single API call sends an `Authorization` header.

**Fix:** Change each controller to inherit from `BaseController` and add appropriate role checks:

```ruby
# backend/app/controllers/api/v1/students_controller.rb
class StudentsController < BaseController   # was: ApplicationController
```

```ruby
# backend/app/controllers/api/v1/batches_controller.rb
class BatchesController < BaseController
```

```ruby
# backend/app/controllers/api/v1/exam_bookings_controller.rb
class ExamBookingsController < BaseController
```

Then add `before_action :authorize_role!` (or Pundit `authorize`) where needed, and update the frontend `api.ts` to include the JWT in every request:

```typescript
const response = await fetch(`${API_BASE_URL}/api/v1/students`, {
  headers: {
    "Authorization": `Bearer ${getToken()}`,
    "Content-Type": "application/json",
  },
});
```

---

### SEC-3 · `DossierTransferJob` is called but never defined — graduation crashes at runtime
🔴 **Critical** · `backend/app/services/graduation/processor.rb:9`

```ruby
DossierTransferJob.perform_later(student.id)  # Line 9 of processor.rb
```

No file `app/jobs/dossier_transfer_job.rb` exists anywhere in the codebase. Calling `graduation!` on any student will raise `NameError: uninitialized constant DossierTransferJob` in production. The spec at `spec/services/graduation/processor_spec.rb` sidesteps this with `allow(DossierTransferJob).to receive(:perform_later)`, which masks the crash.

**Fix — Option A (stub until implemented):**
```ruby
# backend/app/jobs/dossier_transfer_job.rb
class DossierTransferJob < ApplicationJob
  queue_as :default

  def perform(student_id)
    Rails.logger.warn "[DossierTransferJob] Not yet implemented for student #{student_id}"
    # TODO: implement dossier PDF generation and transfer
  end
end
```

**Fix — Option B (defer the job):**
Remove the `perform_later` call from `processor.rb` and log a warning until the job is ready.

---

### SEC-4 · Student emails are always sent to a fabricated placeholder address
🔴 **Critical** · `backend/app/controllers/api/v1/exam_bookings_controller.rb:55–59`, `backend/app/services/meklit/response_handler.rb:68–71`

```ruby
# CURRENT — fabricated address, no real email ever sent
student_email = "#{@student.student_id}@example.com"
MeklitMailer.exam_booking(@exam_booking, student_email).deliver_later
```

The `Student` model has no `email` column. Every email notification — exam bookings, exam results, approval notifications — is sent to `STU001@example.com` and similar non-existent addresses. Students receive nothing.

**Fix:** Add an email column to the students table:

```ruby
# New migration
add_column :students, :email, :string
add_index  :students, :email, unique: true
```

Then permit it in `StudentsController#student_params` and replace the placeholder:
```ruby
student_email = @student.email.presence || raise("Student #{@student.student_id} has no email")
```

---

### SEC-5 · File uploads are silently discarded — ActiveStorage is not implemented
🔴 **Critical** · `backend/app/controllers/api/v1/students_controller.rb:38–48`

```ruby
def handle_file_uploads
  # TODO: Implement ActiveStorage for persistent file storage
  # For now, files are stored in memory and logged
  file_fields.each do |field|
    if params[:student][field].present?
      Rails.logger.info "[StudentsController] Received file upload: #{field}..."
      # Files will be stored in memory until ActiveStorage is implemented
    end
  end
end
```

Documents (profile photo, yellow card, academic certificates, medical certificate) are required for ERTA submission. They are accepted by the API, logged, and then silently dropped on every request. This means the qualification validator's document check is also a no-op — `QualificationValidator#validate_documents` is commented out specifically because files are never persisted.

**Fix:** Implement ActiveStorage attachments on the `Student` model:

```ruby
# backend/app/models/student.rb
has_one_attached  :profile_photo
has_one_attached  :yellow_card
has_one_attached  :grade_8
has_one_attached  :grade_10
has_one_attached  :grade_12
has_one_attached  :medical
```

In production, configure an S3-compatible bucket in `config/storage.yml` and set `config.active_storage.service = :amazon` in `production.rb`.

---

## 4. Reliability & Stability

### REL-1 · `Redis.current` called without a Redis gem — retry counter is permanently broken
🟠 **High** · `backend/app/jobs/meklit_batch_export_job.rb:43`

```ruby
retry_count = Redis.current.incr("meklit_retry:#{batch_id}") rescue 1
```

`redis` is not in the `Gemfile`. At runtime, `Redis` is an uninitialized constant. The `rescue 1` swallows the `NameError` and always returns `1`, meaning every job attempt sees `retry_count = 1`. The retry cap of 5 will never be reached: the job retries indefinitely for the lifetime of the system.

**Fix:** Add the redis gem and configure it, or replace with a database-backed counter:

```ruby
# Gemfile
gem "redis", "~> 5.0"
```

Or use a database-backed approach with ActiveRecord, which is already available:

```ruby
def schedule_retry(batch_id)
  batch = Batch.find(batch_id)
  retry_count = batch.retry_count.to_i + 1
  return if retry_count > MAX_RETRIES
  batch.update_column(:retry_count, retry_count)
  delay = [5 * (2 ** (retry_count - 1)), 60].min
  MeklitBatchExportJob.set(wait: delay.minutes).perform_later(batch_id)
end
```

---

### REL-2 · `ApplicationJob` retry/discard callbacks are commented out
🟠 **High** · `backend/app/jobs/application_job.rb:4–7`

```ruby
class ApplicationJob < ActiveJob::Base
  # retry_on ActiveRecord::Deadlocked
  # discard_on ActiveJob::DeserializationError
end
```

Without `discard_on ActiveJob::DeserializationError`, jobs whose records have been deleted will retry forever, clogging the queue.

**Fix:**
```ruby
class ApplicationJob < ActiveJob::Base
  retry_on  ActiveRecord::Deadlocked, wait: :polynomially_longer, attempts: 5
  discard_on ActiveJob::DeserializationError do |job, error|
    Rails.logger.error "[ApplicationJob] Discarding #{job.class} — record gone: #{error.message}"
  end
end
```

---

### REL-3 · `Date.parse(params[:date])` raises unhandled `ArgumentError`
🟠 **High** · `backend/app/controllers/api/v1/attendance_logs_controller.rb:7`

```ruby
logs = logs.on_date(Date.parse(params[:date])) if params[:date].present?
```

Any malformed date string (e.g. `?date=not-a-date`) raises `ArgumentError: invalid date`, which Rails renders as a 500. `BaseController`'s `rescue_from` does not cover `ArgumentError`.

**Fix:**
```ruby
if params[:date].present?
  begin
    logs = logs.on_date(Date.parse(params[:date]))
  rescue ArgumentError
    return render_error("Invalid date format. Expected YYYY-MM-DD.", status: :bad_request, code: "INVALID_DATE")
  end
end
```

---

### REL-4 · No transaction wrapping exam result recording + penalty application
🟡 **Medium** · `backend/app/controllers/api/v1/exam_bookings_controller.rb:28–40`

```ruby
if @exam_booking.complete!(score, notes)
  if @exam_booking.failed?
    penalty_engine.apply_failure_penalty   # separate DB write, no transaction
  end
  send_exam_result_email
  render json: @exam_booking
end
```

If `complete!` succeeds but `apply_failure_penalty` fails (e.g., a validation error on the student record), the exam is marked complete but no penalty is recorded. The student can immediately re-book.

**Fix:**
```ruby
ActiveRecord::Base.transaction do
  @exam_booking.complete!(result_params[:score], result_params[:notes])
  if @exam_booking.failed?
    raise ActiveRecord::Rollback unless penalty_engine.apply_failure_penalty
  end
end
```

---

### REL-5 · No `JwtDenylist` cleanup scheduled — table grows unboundedly
🟡 **Medium** · `backend/config/recurring.yml`

`JwtDenylist` is designed for periodic cleanup (the model even has `cleanup_expired_tokens`), but it is not scheduled in `recurring.yml`. With a 1-hour JWT expiry, the table will accumulate millions of rows over time, slowing every authenticated request.

**Fix** (add to `backend/config/recurring.yml`):
```yaml
production:
  clear_solid_queue_finished_jobs:
    command: "SolidQueue::Job.clear_finished_in_batches(sleep_between_batches: 0.3)"
    schedule: every hour at minute 12

  cleanup_expired_jwt_tokens:          # ADD THIS
    command: "JwtDenylist.cleanup_expired_tokens"
    schedule: every hour at minute 30
```

---

## 5. Configuration & Environment Hardening

### CFG-1 · SSL not enforced in production
🔴 **Critical** · `backend/config/environments/production.rb:14–16`

```ruby
# config.assume_ssl = true
# config.force_ssl = true
```

Both SSL options are commented out. Running over plain HTTP in production exposes JWT tokens to interception.

**Fix:** Uncomment both lines. If TLS is terminated at an upstream proxy (the case with Kamal's kamal-proxy):
```ruby
config.assume_ssl = true   # trust X-Forwarded-Proto: https from proxy
config.force_ssl  = true   # redirect http:// to https:// at the app level
```

---

### CFG-2 · `config.hosts` not set — Host header injection possible
🟠 **High** · `backend/config/environments/production.rb:45–50`

```ruby
# config.hosts = [
#   "example.com",
#   /.*\.example\.com/
# ]
```

Without this, an attacker can bypass DNS-rebinding protection and trigger 404s or extract information via a crafted `Host` header.

**Fix:**
```ruby
config.hosts = [
  ENV.fetch("APP_HOST"),            # e.g. "api.yourdomain.com"
  /\A[\w\-]+\.yourdomain\.com\z/   # subdomains if needed
]
config.host_authorization = { exclude: ->(request) { request.path == "/up" } }
```

---

### CFG-3 · Production SMTP is completely unconfigured — all emails fail silently
🟠 **High** · `backend/config/environments/production.rb:34–41`

```ruby
# config.action_mailer.smtp_settings = {
#   user_name: Rails.application.credentials.dig(:smtp, :user_name),
#   ...
# }
```

The SMTP block is entirely commented out. In production the mailer defaults to `:sendmail` delivery, which will either silently fail or deliver nothing in a containerised environment without a local MTA.

**Fix:** Uncomment and configure, using an SMTP relay (SendGrid, Postmark, AWS SES, etc.):
```ruby
config.action_mailer.delivery_method = :smtp
config.action_mailer.smtp_settings = {
  user_name:            Rails.application.credentials.dig(:smtp, :user_name),
  password:             Rails.application.credentials.dig(:smtp, :password),
  address:              ENV.fetch("SMTP_ADDRESS", "smtp.sendgrid.net"),
  port:                 587,
  authentication:       :plain,
  enable_starttls_auto: true
}
config.action_mailer.default_url_options = { host: ENV.fetch("APP_HOST") }
```

---

### CFG-4 · Devise `mailer_sender` is still the boilerplate placeholder
🟠 **High** · `backend/config/initializers/devise.rb:26`

```ruby
config.mailer_sender = "please-change-me-at-config-initializers-devise@example.com"
```

Password reset emails will arrive from this address, destroying deliverability and trust.

**Fix:**
```ruby
config.mailer_sender = ENV.fetch("MAILER_FROM", "noreply@drivingschool.et")
```

---

### CFG-5 · `ApplicationMailer` hardcodes `from@example.com` as the default sender
🟠 **High** · `backend/app/mailers/application_mailer.rb:2`

```ruby
default from: "from@example.com"
```

`MeklitMailer` overrides this, but any future mailer that forgets the override will send from `from@example.com`.

**Fix:**
```ruby
default from: ENV.fetch("MAILER_FROM", "noreply@drivingschool.et")
```

---

### CFG-6 · `MeklitApiClient` falls back to the live ERTA production URL in all environments
🟡 **Medium** · `backend/app/services/meklit/meklit_api_client.rb:6`

```ruby
BASE_URL = ENV["MEKLIT_API_BASE_URL"] || "https://api.meklit.gov.et"
```

In development and test, if `MEKLIT_API_BASE_URL` is not set, calls go to the real government API. This can pollute production data and consume API quota during development.

**Fix:** Remove the fallback. Raise if the variable is missing in non-test environments:
```ruby
BASE_URL = ENV.fetch("MEKLIT_API_BASE_URL") do
  raise "MEKLIT_API_BASE_URL must be set" unless Rails.env.test?
  "http://localhost:9999"  # points nowhere in test
end
```

---

### CFG-7 · `production.rb` uses local disk for Active Storage — data lost on every deploy
🟡 **Medium** · `backend/config/environments/production.rb:12`

```ruby
config.active_storage.service = :local
```

Local disk storage in a Docker container is ephemeral. Every container restart, redeploy, or horizontal scale event will lose uploaded documents. This is especially critical given that student documents (grade certificates, medical records) must be retained for ERTA submissions.

**Fix:** Configure an object storage backend in `config/storage.yml` and switch production to use it:
```ruby
config.active_storage.service = :amazon  # or :google, :azure
```

---

### CFG-8 · `package-lock=false` in `.npmrc` makes frontend builds non-deterministic
🟡 **Medium** · `Driving-School-Management-System/.npmrc:1`

```
package-lock=false
```

`npm ci` (used correctly in CI) requires `package-lock.json` and will fail if this option persists, or worse, will install subtly different dependency trees. Remove this line and commit `package-lock.json`.

---

## 6. Performance Optimizations

### PERF-1 · `Student.all` and `Batch.all` have no pagination — full table scans on every list request
🟠 **High** · `backend/app/controllers/api/v1/students_controller.rb:15`, `backend/app/controllers/api/v1/batches_controller.rb:15`

```ruby
@students = Student.all   # returns every row
@batches  = Batch.all     # returns every row
```

With hundreds or thousands of students this will cause slow responses, high memory usage, and large JSON payloads to the frontend.

**Fix** (use Kaminari or built-in Rails pagination):
```ruby
# Gemfile
gem "kaminari"

# students_controller.rb
def index
  page     = params.fetch(:page, 1).to_i
  per_page = params.fetch(:per_page, 50).to_i.clamp(1, 200)
  @students = Student.order(:created_at).page(page).per(per_page)
  render_success({ students: @students, meta: { page: page, total: Student.count } })
end
```

---

### PERF-2 · N+1 query in `Graduation::EligibilityValidator#validate_passed_practical_exam`
🟡 **Medium** · `backend/app/services/graduation/eligibility_validator.rb:13–17`

```ruby
passed = student.exam_bookings
                .where(exam_type: "practical", status: "completed")
                .any? { |b| b.passed? }   # loads all records into Ruby to check each one
```

`any?` with a block forces all matching records to be loaded into memory. For students with many attempts this is wasteful.

**Fix:** Push the filter to the database. Since `passed?` checks `score >= 50`, this can be expressed as a SQL condition:

```ruby
passed = student.exam_bookings
                .where(exam_type: "practical", status: "completed")
                .where("score >= ?", ExamBooking::PASSING_SCORE)
                .exists?
```

---

### PERF-3 · `exam_bookings` composite index missing for the graduation query
🟡 **Medium** · `backend/db/schema.rb`

The graduation and ERTA eligibility checks repeatedly query:
```sql
WHERE student_id = ? AND exam_type = 'practical' AND status = 'completed'
```

The schema only has single-column indexes on `student_id` and `status`. A composite index would serve this pattern much better.

**Fix:**
```ruby
# New migration
add_index :exam_bookings, [:student_id, :exam_type, :status],
          name: "index_exam_bookings_on_student_exam_type_status"
```

---

### PERF-4 · `attendance_logs` index missing on `student_id + phase + attendance_date`
🟡 **Medium** · `backend/db/schema.rb`

`AttendanceLog` has a uniqueness constraint on `(student_id, phase, attendance_date)` but no corresponding index exists in the schema. This means every uniqueness validation triggers a full table scan.

**Fix:**
```ruby
add_index :attendance_logs, [:student_id, :phase, :attendance_date],
          unique: true,
          name: "index_attendance_logs_on_student_phase_date"
```

---

## 7. Testing Gaps

### TEST-1 · The backend's own CI workflow runs Minitest, not RSpec — the real test suite never runs there
🔴 **Critical** · `backend/.github/workflows/ci.yml:56`

```yaml
run: bin/rails db:test:prepare test   # "test" invokes Rails minitest runner
```

The `backend/` subdirectory has its own CI workflow that runs `test` (Minitest) despite the project using RSpec exclusively. All the RSpec specs — models, services, request specs — are never executed by this workflow. The root-level `ci.yml` runs `bundle exec rspec` correctly, but developers relying on the per-backend workflow get a false green.

**Fix** (`backend/.github/workflows/ci.yml`, the `test` job `Run tests` step):
```yaml
- name: Run tests
  env:
    RAILS_ENV: test
    DATABASE_URL: postgres://postgres:postgres@localhost:5432
    RAILS_MASTER_KEY: ${{ secrets.RAILS_MASTER_KEY }}
  run: bundle exec rspec --format progress
```

---

### TEST-2 · No request specs for four controllers
🟠 **High** · `backend/spec/requests/api/v1/`

The following controllers have **zero** request/integration test coverage:
- `AttendanceLogsController` — the LMS core loop
- `MockTestsController`
- `BatchesController`
- `LmsProgressController`

These are critical paths for student progression. The existing 4 request spec files cover only auth, students, exam_bookings, and users.

**Fix:** Create at minimum happy-path + auth-guard specs for each:
```
spec/requests/api/v1/attendance_logs_spec.rb
spec/requests/api/v1/mock_tests_spec.rb
spec/requests/api/v1/batches_spec.rb
spec/requests/api/v1/lms_progress_spec.rb
```

---

### TEST-3 · Frontend has zero test infrastructure
🟠 **High** · `Client/`

There are no test files, no test configuration, and no test runner installed in the frontend. The CI only runs `lint` and `build`, which won't catch runtime regressions.

**Fix:**
```bash
cd Client
npm install -D vitest @testing-library/react @testing-library/jest-dom @vitejs/plugin-react jsdom
```

Add a `vitest.config.ts`, at minimum smoke-test the enrollment wizard:
```typescript
// src/components/enrollment/__tests__/enrollment-wizard.test.tsx
```

---

### TEST-4 · `actions/checkout@v6` does not exist — backend CI uses an invalid action version
🟠 **High** · `backend/.github/workflows/ci.yml:14, 33, 60`

```yaml
uses: actions/checkout@v6   # v6 does not exist; v4 is the latest stable
```

GitHub Actions will resolve this to the latest available tag with a `v6` major. Currently this resolves to nothing and the workflow should be failing. The root workflow correctly uses `@v4`.

**Fix:** Replace all three occurrences in `backend/.github/workflows/ci.yml`:
```yaml
uses: actions/checkout@v4
```

---

## 8. CI/CD & Operational Readiness

### OPS-1 · Kamal `deploy.yml` has hardcoded placeholder server IP
🟠 **High** · `backend/config/deploy.yml`

```yaml
servers:
  web:
    - 192.168.0.1    # placeholder — private subnet IP, not a real production server
```

The IP `192.168.0.1` is a private network default gateway. Deploying with this will fail silently or connect to the wrong host.

**Fix:** Replace with the actual server IP or parameterize via environment variable:
```yaml
servers:
  web:
    - <%= ENV.fetch("DEPLOY_SERVER_IP") %>
```

---

### OPS-2 · SSL/TLS proxy is commented out in Kamal deploy config
🟠 **High** · `backend/config/deploy.yml`

The proxy section for TLS is commented out. Without it, kamal-proxy will serve traffic on plain HTTP.

**Fix:** Uncomment and configure in `deploy.yml`:
```yaml
proxy:
  ssl: true
  host: yourdomain.com
```

---

### OPS-3 · No centralised error tracking (Sentry, Bugsnag, etc.)
🟡 **Medium** · Entire project

There is no error-tracking integration. Unhandled exceptions in production will be invisible unless someone manually scans logs.

**Fix:**
```ruby
# Gemfile
gem "sentry-ruby"
gem "sentry-rails"

# config/initializers/sentry.rb
Sentry.init do |config|
  config.dsn = ENV["SENTRY_DSN"]
  config.breadcrumbs_logger = [:active_support_logger, :http_logger]
  config.traces_sample_rate = 0.1
end
```

---

### OPS-4 · No database backup strategy documented or automated
🟡 **Medium** · Entire project

There is no backup strategy, cron job, or documentation for PostgreSQL backups. For a system that manages government-facing student records, data loss risk is significant.

**Fix:** At minimum, add a daily `pg_dump` Kamal accessory or hook in `post-deploy.sample`, and document it in the README.

---

### OPS-5 · No rate limiting on any endpoint
🟡 **Medium** · Entire project

The login endpoint (`POST /api/v1/auth/login`) and the registration endpoint have no rate limiting. An attacker can brute-force credentials or flood the API.

**Fix:**
```ruby
# Gemfile
gem "rack-attack"

# config/initializers/rack_attack.rb
Rack::Attack.throttle("login/ip", limit: 10, period: 60) do |req|
  req.ip if req.path == "/api/v1/auth/login" && req.post?
end
Rack::Attack.throttle("register/ip", limit: 5, period: 60) do |req|
  req.ip if req.path == "/api/v1/auth/register" && req.post?
end
```

---

## 9. Documentation Deficiencies

### DOC-1 · No OpenAPI / Swagger specification
🟡 **Medium** · Entire project

The README contains inline curl examples but no machine-readable OpenAPI spec. This makes frontend integration error-prone and blocks auto-generated client SDK creation.

**Fix:**
```ruby
# Gemfile, development group
gem "rswag-api"
gem "rswag-ui"
gem "rswag-specs"
```

Run `rails rswag:specs:swaggerize` after annotating existing request specs with Rswag DSL.

---

### DOC-2 · No `.env.example` file for the frontend (`Client/`)
🟡 **Medium** · `Client/`

`api.ts` reads `NEXT_PUBLIC_API_URL` and `NEXT_PUBLIC_DEFAULT_BATCH_ID` but no `.env.example` exists for the `Client/` directory. New developers will not know which variables to set.

**Fix:** Create `Client/.env.example`:
```
NEXT_PUBLIC_API_URL=http://localhost:8080
NEXT_PUBLIC_DEFAULT_BATCH_ID=1
```

---

### DOC-3 · Missing architecture diagram
🟢 **Low** · README

The README describes components in text but lacks any visual overview of how frontend, backend, Solid Queue, PostgreSQL, and the ERTA API interact.

---

## 10. Code Quality & Maintainability

### CODE-1 · `LicenseUpgrade#reject!` silently ignores its `reason:` parameter
🟠 **High** · `backend/app/models/license_upgrade.rb:42`

```ruby
def reject!(reason: nil)
  update!(status: "rejected")   # reason is accepted but never saved
end
```

The `rejection_reason` column is not shown in the schema for `license_upgrades`, but the method signature promises to record a reason. The parameter is silently ignored.

**Fix:** Either add the column and save it, or remove the parameter:
```ruby
# Option A — save it (requires migration)
def reject!(reason: nil)
  update!(status: "rejected", rejection_reason: reason)
end

# Option B — remove the misleading parameter
def reject!
  update!(status: "rejected")
end
```

---

### CODE-2 · Inconsistent response format across controllers
🟡 **Medium** · Multiple files

`BaseController` subclasses (`UsersController`, `AuthController`, `AttendanceLogsController`, etc.) return a `{ success:, data:, message: }` envelope. But `ApplicationController` subclasses (`StudentsController`, `BatchesController`, `ExamBookingsController`) return bare ActiveRecord JSON with `{ errors: }` for failures. This forces the frontend to handle two different response shapes.

**Fix:** After fixing SEC-2 (inheriting from BaseController), standardise all responses. Consult `render_success` / `render_error` in `BaseController` and remove bare `render json: @batch` calls.

---

### CODE-3 · `Graduation::Processor` hard-codes a location-specific string
🟢 **Low** · `backend/app/services/graduation/processor.rb:22`

```ruby
GraduationRecord.create!(
  transfer_destination: "Kifle Ketema Sub-City"   # hardcoded
)
```

This should be driven from the student's registered sub-city or a configuration constant, not a literal string.

---

### CODE-4 · License categories and prices are hardcoded in the controller
🟢 **Low** · `backend/app/controllers/api/v1/license_categories_controller.rb`

All four license categories with their prices, age requirements, and training hours are in-code constants. Changing a price requires a code deployment.

**Fix:** Extract to a database table or a YAML configuration file.

---

### CODE-5 · `MeklitApiClient` constants evaluated at class-load time
🟢 **Low** · `backend/app/services/meklit/meklit_api_client.rb:6–8`

```ruby
BASE_URL    = ENV["MEKLIT_API_BASE_URL"] || "https://api.meklit.gov.et"
API_VERSION = "v1"
```

Ruby constants defined at class load time are frozen; changing the env variable after the process starts has no effect. This also complicates test stubbing. Prefer method-level lookups:

```ruby
def base_url    = ENV.fetch("MEKLIT_API_BASE_URL")
def api_version = "v1"
```

---

## 11. What Passes

The following areas are well-implemented and require no changes:

| Area | Notes |
|---|---|
| **Password hashing** | Devise with bcrypt, 12 stretches in production, 1 in test |
| **JWT auth & revocation** | Denylist strategy correctly implemented; 1-hour expiry |
| **Pundit authorization** | `UserPolicy` correctly gates admin-only operations; `ApplicationPolicy` denies by default |
| **Input validation** | Strong parameters on all controllers; thorough model validations with inclusion, numericality, presence checks |
| **Database indexes on hot paths** | `students.student_id`, `students.document_id`, `exam_bookings.student_id`, `jwt_denylist.jti`, `users.email` all indexed |
| **AASM state machine** | Student lifecycle transitions with guards are clean and well-tested |
| **Service object pattern** | Business logic cleanly extracted into `app/services/` |
| **Structured logging in production** | `config.log_tags = [:request_id]` and `TaggedLogging.logger(STDOUT)` |
| **Multi-stage Docker image** | Non-root user, jemalloc, `--no-install-recommends`, minimal final image |
| **Dependabot** | Weekly updates for both Bundler and GitHub Actions |
| **Bundler-audit + Brakeman in CI** | Security scanning on every push to main (backend subdirectory workflow) |
| **RuboCop** | Omakase styleguide enforced in CI |
| **Health check** | `GET /up` returns 200 by default |
| **Parameter filtering** | `passw`, `email`, `token`, etc. filtered from logs |
| **Solid Queue + Solid Cache** | Database-backed; no Redis dependency in production (other than the broken retry counter) |
| **Factory Bot + Faker + Shoulda Matchers** | Rich test factory setup for all 11 models |
| **Model specs** | All key business rules for Student, ExamBooking, MockTest, AttendanceLog, Invoice, etc. covered |
| **Service specs** | All 10 service objects have dedicated spec files |
| **README** | Comprehensive setup, usage examples, env variable table, deployment instructions |
| **Git ignore / gitattributes** | Credentials, env files, master.key all excluded; LF line endings enforced |

---

*End of report.*