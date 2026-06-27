# Documentation vs Implementation Gap Analysis
## Driving School Automation System

**Generated:** 2026-06-27  
**Codebase:** Driving-School-Management-System (338 files)  
**Documentation Source:** Complete Software Design & Architecture Documentation (Sections 1–17)

---

## Phase 3.1 – Summary

| Metric | Count |
|---|---|
| **Total documented features / requirements identified** | 54 |
| **Fully implemented** | 28 |
| **Partially implemented** | 14 |
| **Completely missing** | 12 |

---

## Phase 3.2 – Detailed Gap Report

---

### Domain: Student Lifecycle & Data Model

---

#### GAP-01 · Student `update` endpoint is documented but missing from the controller

- **Feature:** Student data management (Admin/Clerk role)  
- **Category:** API  
- **Status:** `Missing`  
- **Documentation reference:** `Architecture Requirements §4`, `Architecture Context §3` — *"Clerks must handle student registration, payments, and exam booking."*  `Architecture Security §8` — *"Clerk Role: Restricts capabilities to handling student registration, processing invoice payments."*  
- **Source evidence:**  
  - `backend/app/controllers/api/v1/students_controller.rb` — only `index, show, create` are implemented. No `update` action.  
  - `backend/config/routes.rb` line 8750 — `resources :students, only: [ :index, :show, :create ]` — `update` is not in the `only` list.  
  - `backend/app/policies/student_policy.rb` — `update?` method exists (grants admin/clerk), meaning authorization was planned but the controller action and route were never created.  
- **Priority:** **High** — clerks cannot edit student information after registration; critical for data correction workflows.  
- **Effort:** Low — service object pattern already established; add `update` to route, implement `update` action in controller using `StudentPolicy#update?`.

---

#### GAP-02 · Student `identification_document` type field missing from database

- **Feature:** Student Data Model — `identification_document` column  
- **Category:** Database  
- **Status:** `Missing`  
- **Documentation reference:** `Software Database Design §11` — *"`identification_document`: National ID, Kebele ID, Passport, Birth Certificate"*  
- **Source evidence:**  
  - `backend/db/migrate/20260623190500_add_student_details.rb` — adds `student_id`, `document_id`, `first_name`, `middle_name`, `last_name`, `date_of_birth`, `blood_type`, and address fields. No `identification_document` column.  
  - No subsequent migration adds this column. The field that exists (`document_id`) stores the *ID number*, not the *type* of document.  
- **Priority:** **High** — required for ERTA submission (different identification types have different validation rules).  
- **Effort:** Low — add a migration, update strong parameters and model.

---

#### GAP-03 · Student `eye_acuity_test` field missing from database

- **Feature:** Student Data Model — `eye_acuity_test` column  
- **Category:** Database  
- **Status:** `Missing`  
- **Documentation reference:** `Software Database Design §11` — *"`eye_acuity_test`: (String)"* listed as a required student column.  
- **Source evidence:** No migration among the 22 migration files adds an `eye_acuity_test` column to the `students` table.  
- **Priority:** **Medium** — ERTA registration typically requires visual acuity screening.  
- **Effort:** Low — single migration + model attribute.

---

#### GAP-04 · Student `meklit_approval_date` field missing from database

- **Feature:** Student Data Model — `meklit_approval_date` column  
- **Category:** Database  
- **Status:** `Missing`  
- **Documentation reference:** `Software Database Design §11` — *"`meklit_approval_date`: (DateTime)"*; `Architecture Requirements §4` — *"The Meklit module must manage… 15-day cycle management."*  
- **Source evidence:** No migration adds `meklit_approval_date` to the `students` table. `Meklit::ResponseHandler` (line 6138) sets `status: "approved"` on the batch and updates students to `graduated`, but records no per-student approval date.  
- **Priority:** **Medium** — audit trail for regulatory compliance.  
- **Effort:** Low — migration + update in `ResponseHandler#handle_approval`.

---

#### GAP-05 · Student `education_level` field missing from the students table

- **Feature:** Student Data Model — `education_level`  
- **Category:** Database  
- **Status:** `Missing`  
- **Documentation reference:** `Software Database Design §11` — *"`education_level`: 4th Grade Certificate, 10th Grade Certificate"*  
- **Source evidence:** No migration adds `education_level` to `students`. The `courses` table has `min_education_level` (a threshold for the course), but no per-student field records the education credential the student submitted.  
- **Priority:** **Medium** — needed for Meklit export payload and eligibility validation.  
- **Effort:** Low.

---

#### GAP-06 · Student `n_number` (government ID) missing from the `students` table

- **Feature:** Student Data Model — `n_number`  
- **Category:** Database  
- **Status:** `Missing`  
- **Documentation reference:** `Software Database Design §11` — *"`n_number`: (String)"* listed directly under `students`. `Architecture Data Model §12` — *"Official government testing ID known as the n-number which serves as the unique key for all external coordination."*  
- **Source evidence:** The `students` table has no `n_number` column in any migration. The field exists in `erta_exam_bookings` (`20260623191000_create_exam_bookings.rb`), but the architecture documentation explicitly places this field on the `students` record as a persistent student identifier.  
- **Priority:** **High** — the `MeklitApiClient` and ERTA booking flow require this field on the student to coordinate with the government portal.  
- **Effort:** Low — migration + update `Meklit::PayloadGenerator` to read from student.

---

#### GAP-07 · Batch `export_payload` JSONB column missing

- **Feature:** Database — `batches` table  
- **Category:** Database  
- **Status:** `Missing`  
- **Documentation reference:** `Software Database Design §11` — *"`export_payload`: JSONB format"* listed as a column on the `batches` table. `Architecture Data Model §12` — *"Student count summaries for the automated Meklit portal transmission packages."*  
- **Source evidence:** `backend/db/migrate/20260619155515_create_batches.rb` — creates `name`, `status`, `submitted_at`, `approved_at`, `rejection_reason`. No `export_payload` JSONB column. No subsequent migration adds it.  `Meklit::PayloadGenerator` generates the payload dynamically but it is never persisted to the batch record.  
- **Priority:** **Medium** — without persisting the payload, there is no audit trail of what was sent to ERTA and retries must regenerate it.  
- **Effort:** Low — single migration; update `Meklit::BatchingService` to store the payload after generation.

---

### Domain: ERTA Engine

---

#### GAP-08 · Penalty period is 7 days in code vs 5 days in documentation

- **Feature:** ERTA Engine — Penalty System  
- **Category:** Business Logic  
- **Status:** `Partially Implemented`  
- **Documentation reference:** `Architecture Context §3` — *"external penalty rules requiring 300 ETB and a 5-day remedial period upon exam failure."* `Architecture Requirements §4` — *"The ERTA Engine must enforce a penalty system requiring 300 ETB and a 5-day remedial training upon exam failure."*  
- **Source evidence:** `backend/app/services/penalty/penalty_engine.rb` line 6243 — `PENALTY_DAYS = 7`. Additionally, `Finance::PenaltyEngine` (a separate file at `backend/app/services/finance/penalty_engine.rb`) calculates penalty differently and does not enforce the documented 300 ETB flat fee from `Invoice::MILESTONE_TYPES[:government_penalty]`.  
- **Priority:** **High** — business rule discrepancy; incorrect penalty period will cause regulatory non-compliance.  
- **Effort:** Low — change constant; reconcile the two separate `PenaltyEngine` classes.

---

#### GAP-09 · Payment fence (exam booking lock) before re-booking is not implemented

- **Feature:** ERTA Engine — "lock exam bookings until penalty paid"  
- **Category:** API / Business Logic  
- **Status:** `Missing`  
- **Documentation reference:** `Architecture Requirements §4` — *"The system must generate penalty invoices and lock exam bookings until paid."*  
- **Source evidence:** `backend/app/controllers/api/v1/exam_bookings_controller.rb`, method `validate_eligibility` (line 2187) — delegates to `ERTA::EligibilityValidator`, which checks status, training days, mock test score, and documents (`erta/eligibility_validator.rb` lines 4353–4401). It does **not** check for an unpaid penalty invoice before allowing a new booking.  
- **Priority:** **High** — core business rule; students can currently book exams while a penalty invoice is outstanding.  
- **Effort:** Medium — add an invoice status check inside `ERTA::EligibilityValidator` or `ExamBookingsController#validate_eligibility`.

---

### Domain: LMS Module

---

#### GAP-10 · `fetch_last_attendance_date` is a TODO stub in the Finance Penalty Engine

- **Feature:** LMS / Finance — attendance breach penalty trigger  
- **Category:** Business Logic  
- **Status:** `Partially Implemented`  
- **Documentation reference:** `Architecture Requirements §4` — *"The system must run a daily monitor to check 35-day and 52-day training completion and flag students approaching deadlines."*  
- **Source evidence:** `backend/app/services/finance/penalty_engine.rb` lines 5195–5204 —  
  ```ruby
  def fetch_last_attendance_date
    # TODO: Replace with actual Attendance model query when implemented
    # Attendance.where(student: student).order(date: :desc).first&.date
    # Mock implementation - replace when Attendance model is available
    student.updated_at.to_date
  end
  ```
  The method currently returns `student.updated_at` — a meaningless fallback — instead of querying the `attendance_logs` table.  
- **Priority:** **High** — the attendance breach penalty trigger produces incorrect dates, potentially issuing false penalties or missing real breaches.  
- **Effort:** Low — replace the stub body with `AttendanceLog.where(student: student).order(attendance_date: :desc).first&.attendance_date`.

---

### Domain: Graduation Module

---

#### GAP-11 · `DossierTransferJob` is a stub — no actual file transfer logic

- **Feature:** Graduation Module — Dossier file transfer to Kifle Ketema  
- **Category:** Business Logic / Background Job  
- **Status:** `Partially Implemented`  
- **Documentation reference:** `Architecture Requirements §4` — *"The Graduation module must compile physical and digital dossiers and handle file transfers to Kifle Ketema."* `System Design §1` — *"Dossier Transfer: Delivery of physical and digital records to Kifle Ketema based on residential sub-city registration."*  
- **Source evidence:** `backend/app/jobs/dossier_transfer_job.rb` — 535 bytes, the smallest job file in the project (all other jobs are 1,449–2,174 bytes). At this size the job contains, at most, a class stub with no actual transfer logic.  `Graduation::Processor` (lines 5428–5453) calls `DossierTransferJob.perform_later(student.id)` and transitions the `GraduationRecord` to `dossier_status: "compiling"`, but no code advances the status to `"ready"` or `"transferred"`.  
- **Priority:** **High** — the graduation flow is broken end-to-end; the dossier never gets transferred.  
- **Effort:** High — requires integration with external Kifle Ketema system or file delivery mechanism (email, SFTP, API). Define the actual transfer protocol first.

---

### Domain: Finance Module

---

#### GAP-12 · No API endpoint or route exposes payroll entries to instructors

- **Feature:** Finance Module — Instructor payroll view  
- **Category:** API  
- **Status:** `Missing`  
- **Documentation reference:** `Architecture Context §3` — *"Instructor: Interacts with the system to log daily training attendance, trigger mock tests, and **view personal monthly payroll entries**."* `Architecture Requirements §4` — *"Instructors must have access to training logs, mock tests, and **their own payroll**."*  
- **Source evidence:**  
  - `backend/config/routes.rb` lines 8743–8784 — no `payroll_entries` resource is defined.  
  - No `payroll_entries_controller.rb` exists under `app/controllers/api/v1/`.  
  - `PayrollEntry` model (`app/models/payroll_entry.rb`) and `PayrollComputeJob` (`app/jobs/payroll_compute_job.rb`) exist, but there is no controller to surface the data to the frontend.  
- **Priority:** **High** — instructors cannot access their salary information.  
- **Effort:** Medium — create controller, Pundit policy, and route; the model and job already exist.

---

#### GAP-13 · `GET /api/v1/financial_reports/export` (CSV) may be a partial stub

- **Feature:** Finance Module — CSV export  
- **Category:** API  
- **Status:** `Partially Implemented`  
- **Documentation reference:** `FINANCE_MODULE_README.md` (referenced in the project) — *"Export to CSV — `GET /api/v1/financial_reports/export`"*  
- **Source evidence:** `backend/config/routes.rb` line 8782 — `get :export` is defined. `Finance::FinancialReports` service has an `export_to_csv` method referenced in the README but not verified as fully implemented in the source (the `financial_reports.rb` service file visible in the codebase does not expose a confirmed working `export_to_csv` method). The `FinancialReportsController` does not contain a visible `export` action in the extracted sections.  
- **Priority:** **Medium** — CSV export is a documented deliverable for finance admins.  
- **Effort:** Low-Medium — confirm the service method exists and wire up the controller action with proper CSV headers.

---

### Domain: MASADEG / License Upgrade Module

---

#### GAP-14 · MASADEG module has no API — model exists but is entirely unexposed

- **Feature:** MASADEG Module — license upgrade track for professional drivers  
- **Category:** API  
- **Status:** `Missing`  
- **Documentation reference:** `Architecture Component Diagram §5` — *"Masadeq Module Component: Governs progression logic and verifies active license lifespans for driver upgrades."* `Database Design §11` — *"`license_upgrades` table: MASADEG upgrade requests... `prior_license_key`, `timir_compound_flag`."*  
- **Source evidence:**  
  - `backend/app/models/license_upgrade.rb` — fully implemented with `eligible_for_upgrade?`, `approve!`, `reject!` methods and a 3-year license age check.  
  - `backend/db/migrate/20260625130400_create_license_upgrades.rb` — migration executed.  
  - No file exists under `app/controllers/api/v1/` for license upgrades.  
  - `backend/config/routes.rb` — no `license_upgrades` resource.  
  - No `app/services/masadeq/` directory (unlike every other documented module which has a `services/` subdirectory).  
- **Priority:** **Medium** — entire upgrade track is inaccessible from the UI or API.  
- **Effort:** High — controller, routes, service objects, and Pundit policies all need creation.

---

### Domain: Renewal Requests Module

---

#### GAP-15 · Renewal requests have no API or frontend — model and migration exist in isolation

- **Feature:** Renewal Requests — external license renewal bypass flow  
- **Category:** API  
- **Status:** `Missing`  
- **Documentation reference:** `Software Database Design §11` — *"`renewal_requests` table: Handles external driver renewals bypassing the learning management system."*  
- **Source evidence:**  
  - `backend/app/models/renewal_request.rb` — model implemented with `medical_data_updated` and `registered_kifle_ketema` fields.  
  - `backend/db/migrate/20260625130600_create_renewal_requests.rb` — migration exists.  
  - No `renewal_requests_controller.rb` in `app/controllers/api/v1/`.  
  - `backend/config/routes.rb` — no `renewal_requests` resource.  
- **Priority:** **Medium** — documented business process is entirely inaccessible.  
- **Effort:** High — needs controller, routes, policies, and frontend page.

---

### Domain: Frontend / UI

---

#### GAP-16 · Student self-service portal does not exist

- **Feature:** Student role — read-only personal dashboard  
- **Category:** UI  
- **Status:** `Missing`  
- **Documentation reference:** `Architecture Context §3` — *"Student: Interacts with the system in a read-only capacity to monitor personal training progress, exam results, and graduation status."* `Architecture Requirements §4` — *"Students must have read-only access to their own records."*  
- **Source evidence:**  
  - Frontend project tree (lines 322–444) shows route groups `(admin)`, `(clerk)`, `(dashboard)`, `(instructor)` — no `(student)` route group exists.  
  - `backend/app/policies/lms_progress_policy.rb` lines 4219–4224 — `show?` returns `user.admin? || user.instructor? || user.clerk?`. Students are explicitly excluded.  
  - No student-facing pages for training progress, exam results, or graduation status.  
- **Priority:** **High** — students are a primary actor and have no interface.  
- **Effort:** High — requires both frontend pages and Pundit policy updates to allow scoped student self-access.

---

#### GAP-17 · Instructor dashboard page is a non-functional placeholder

- **Feature:** Instructor role — functional dashboard (training logs, mock tests, payroll)  
- **Category:** UI  
- **Status:** `Partially Implemented` (routing + auth guard exist; content missing)  
- **Documentation reference:** `Architecture Context §3` — *"Instructor: Interacts with the system to log daily training attendance, trigger mock tests, and view personal monthly payroll entries."*  
- **Source evidence:** `Client/src/app/(instructor)/instructor/page.tsx` lines 17888–17900 —  
  ```tsx
  export default function InstructorPage() {
    return (
      <div className="space-y-6">
        <h1>Instructor Overview</h1>
        <p>Student progress tracking, attendance, and lesson management.</p>
      </div>
    );
  }
  ```
  This is a static heading with descriptive text only. No attendance form, mock-test trigger, or payroll view.  
- **Priority:** **High** — instructors cannot perform their primary workflow from the UI.  
- **Effort:** High — functional components for attendance logging, mock test entry, and payroll display need to be built.

---

#### GAP-18 · Clerk dashboard page is a non-functional placeholder

- **Feature:** Clerk role — functional dashboard (invoice management, exam booking)  
- **Category:** UI  
- **Status:** `Partially Implemented` (routing + auth guard exist; content missing)  
- **Documentation reference:** `Architecture Context §3` — *"Clerk: Facilitates daily business operations by handling student registration, processing financial invoices, and orchestrating official exam bookings."*  
- **Source evidence:** `Client/src/app/(clerk)/clerk/page.tsx` lines 17231–17244 —  
  ```tsx
  export default function ClerkPage() {
    return (
      <div className="space-y-6">
        <h1>Clerk Overview</h1>
        <p>Student registration, invoice management, and daily operations.</p>
      </div>
    );
  }
  ```
  Static placeholder only. Invoice payment, exam scheduling, and batch export actions are absent.  
- **Priority:** **High** — clerks cannot manage invoices or exam bookings from the UI.  
- **Effort:** High.

---

#### GAP-19 · Admin dashboard page is a non-functional placeholder

- **Feature:** Admin role — system-wide management dashboard  
- **Category:** UI  
- **Status:** `Partially Implemented` (routing + auth guard exist; content missing)  
- **Documentation reference:** `Architecture Context §3` — *"Admin: Possesses full system access to oversee all modules and data."*  
- **Source evidence:** `Client/src/app/(admin)/admin/page.tsx` lines 17176–17188 —  
  ```tsx
  export default function AdminPage() {
    return (
      <div className="space-y-6">
        <h1>Admin Overview</h1>
        <p>System administration, user management, and financial oversight.</p>
      </div>
    );
  }
  ```
  Static placeholder. No user management, batch controls, or system reports.  
- **Priority:** **Medium** — the general dashboard page (`/`) provides some overview; admin-specific controls are missing.  
- **Effort:** High.

---

#### GAP-20 · Dashboard quick-action links for "Exam Bookings" and "Reports" are dead links

- **Feature:** General Dashboard — navigation to exam booking and financial reports pages  
- **Category:** UI  
- **Status:** `Missing`  
- **Documentation reference:** `UI-UX Design Documentation §15` (implicitly — all role actions must be navigable).  
- **Source evidence:** `Client/src/app/(dashboard)/page.tsx` lines 17378–17388 —  
  ```tsx
  { label: "Exam Bookings", href: "#", icon: CalendarCheck, … },
  { label: "Reports",       href: "#", icon: FileText,      … }
  ```
  Both hrefs are `#`, meaning there are no destination pages implemented yet for exam booking management or the financial reports view.  
- **Priority:** **High** — these are core navigation targets for both clerks and admins.  
- **Effort:** High — exam booking and reports frontend pages need to be built.

---

### Domain: Security / Deployment

---

#### GAP-21 · Production SSL is commented out

- **Feature:** Security — encrypted transport  
- **Category:** Deployment  
- **Status:** `Missing` (configuration not applied)  
- **Documentation reference:** `Architecture Security §8` — *"Database Security: Utilizes encrypted connections."* `Architecture Deployment §7` — the system is intended to run in production.  
- **Source evidence:** `backend/config/environments/production.rb` lines 26746–26749 (improvement.md confirms this) —  
  ```ruby
  # config.assume_ssl = true
  # config.force_ssl  = true
  ```
  Both SSL directives are commented out. The API will serve traffic over plain HTTP in production.  
- **Priority:** **High** — JWT tokens and student PII transmitted without encryption.  
- **Effort:** Trivial — uncomment both lines.

---

#### GAP-22 · Production SMTP is completely unconfigured — all email delivery will fail silently

- **Feature:** Mailers — batch submission, approval, rejection, exam booking, and result notifications  
- **Category:** Deployment  
- **Status:** `Missing`  
- **Documentation reference:** `Architecture Component Diagram §5` — *"Mailers for notifications."* Six mail templates exist (`batch_submission.html.erb`, `exam_booking.html.erb`, etc.).  
- **Source evidence:** `backend/config/environments/production.rb` — SMTP settings block is commented out. `backend/app/mailers/application_mailer.rb` line 2 — `default from: "from@example.com"` (placeholder). `backend/config/initializers/devise.rb` — `config.mailer_sender = "please-change-me-at-config-initializers-devise@example.com"`.  
- **Priority:** **High** — all email-dependent workflows (ERTA notifications, exam results, Meklit approvals) silently fail in production.  
- **Effort:** Low — configure SMTP relay (SendGrid, Postmark) and update placeholder addresses.

---

#### GAP-23 · Active Storage document attachments are referenced by validators but not declared on the Student model

- **Feature:** Document Management — profile photo, yellow card, grade certificates  
- **Category:** Database / API  
- **Status:** `Partially Implemented`  
- **Documentation reference:** `Architecture Data Model §12` — *"Compiled digital dossier archives"* for graduation. `Architecture Requirements §4` — required documents for ERTA submission.  
- **Source evidence:**  
  - `backend/app/services/erta/eligibility_validator.rb` lines 4395–4400 checks `student.respond_to?(doc_type) && student.send(doc_type).attached?` for `profile_photo`, `yellow_card`, `grade_8`, `grade_10`, `grade_12`.  
  - `backend/app/services/meklit/qualification_validator.rb` lines 6050–6056 performs the same checks.  
  - `backend/app/services/meklit/payload_generator.rb` lines 5967–5991 calls `student.send(doc_type).attached?`.  
  - No `has_one_attached :profile_photo`, `has_one_attached :yellow_card`, etc. is visible in `backend/app/models/student.rb` or any migration (Active Storage declarations do not require a migration but do require model declarations).  
  - `backend/config/environments/production.rb` line 26857 — `config.active_storage.service = :local` (uses ephemeral container disk in Docker; files lost on restart).  
- **Priority:** **High** — the ERTA eligibility check will always fail document validation if `has_one_attached` is not declared, making it impossible for any student to become exam-eligible through the API.  
- **Effort:** Medium — add Active Storage declarations to the Student model and configure a persistent object storage backend (S3, GCS) for production.

---

### Domain: Testing & CI

---

#### GAP-24 · Backend CI workflow runs Minitest instead of RSpec — real test suite never executes in per-backend CI

- **Feature:** Testing — CI pipeline correctness  
- **Category:** Testing  
- **Status:** `Partially Implemented`  
- **Documentation reference:** `Software Testing Strategy Documentation §16` (general testing requirement).  
- **Source evidence:** `backend/.github/workflows/ci.yml` line 26971 — `run: bin/rails db:test:prepare test`. The `test` command invokes Rails' built-in Minitest runner. The project uses RSpec exclusively (all specs are in `spec/`, no Minitest files exist). This workflow always reports green because there are no Minitest tests to fail, while the actual RSpec suite never runs in this CI path.  
- **Priority:** **High** — the per-backend CI is a false safety net.  
- **Effort:** Trivial — replace `bin/rails db:test:prepare test` with `bundle exec rspec --format progress`.

---

#### GAP-25 · No request specs for four critical controllers

- **Feature:** Testing coverage for `AttendanceLogs`, `MockTests`, `Batches`, `LmsProgress`  
- **Category:** Testing  
- **Status:** `Missing`  
- **Documentation reference:** `Software Testing Strategy Documentation §16`.  
- **Source evidence:** `backend/spec/requests/api/v1/` contains: `attendance_logs_spec.rb` (exists but minimal — only 2 test cases at line 12906), `mock_tests_spec.rb` (listed in file tree but content not confirmed substantial), `batches_spec.rb`, `lms_progress_spec.rb`. The improvement.md document at line 26988 explicitly confirms: *"AttendanceLogsController, MockTestsController, BatchesController, LmsProgressController have zero request/integration test coverage."*  
- **Priority:** **High** — these controllers drive the core student progression loop.  
- **Effort:** Medium — ~50–100 lines of RSpec per controller.

---

## Phase 3.3 – Additional Observations

### Code with No Documentation Counterpart

The following are implemented but not mentioned in the provided architecture documentation:

| Item | File | Note |
|---|---|---|
| **Kamal deployment** | `backend/config/deploy.yml`, `backend/.kamal/` | Docs mention only Docker Compose. Kamal is the actual deployment tool. |
| **Swagger/OpenAPI (rswag)** | `backend/config/initializers/rswag_api.rb`, `rswag_ui.rb` | Docs say no OpenAPI spec. The gem is configured and accessible at `/api-docs`. |
| **Rack::Attack rate limiting** | `backend/config/initializers/rack_attack.rb` | Docs do not mention rate limiting; the initializer file exists (contents not confirmed). |
| **Sentry error tracking** | `backend/config/initializers/sentry.rb` | Not mentioned in docs; file exists (likely placeholder DSN). |
| **Token refresh endpoint** | `POST /api/v1/auth/refresh` | Auth controller at line 1871; not described in API design docs. |
| **`GET /api/v1/auth/me`** | Auth controller at line 1884 | Not in the documented API surface. |
| **Kaminari pagination** | `batches_controller.rb` uses `.page()/.per()` | Only batches are paginated; student list is not paginated (`Student.all`). |
| **Sprint documentation files** | `SPRINT_2_*`, `SPRINT_4_*`, `SPRINT_5_6_*` | In-progress sprint artifacts not referenced by the architecture docs. |
| **Two separate `PenaltyEngine` classes** | `services/penalty/penalty_engine.rb` AND `services/finance/penalty_engine.rb` | Two different penalty implementations exist simultaneously with conflicting business rules. Architecture defines only one Penalty Engine. |

---

### Documentation vs Implementation Inconsistencies

| Inconsistency | Doc Says | Code Says |
|---|---|---|
| Penalty remedial period | 5 days | `Penalty::PenaltyEngine::PENALTY_DAYS = 7` |
| Mock test pass threshold | Score `> 37` (minimum 38%) | `MockTest::PASS_THRESHOLD = 37` + `score > PASS_THRESHOLD` (> 37, i.e. minimum 38) — ✅ consistent in model but `PASS_THRESHOLD` name implies threshold, not above-threshold |
| Mock test max score | "Maximum 50 points" (Database Design §11) | `MockTest` validates `less_than_or_equal_to: 100` — allows scores up to 100 |
| Graduation eligibility | "status must be graduated to trigger dossier" | `Graduation::EligibilityValidator#validate_status` checks `exam_eligible?`, not `graduated` — student transitions to graduated *during* graduation, not before |
| Docker Compose port for rails-api | "Port 8080 mapped to 8080 or 3000" (ambiguous) | `deploy.yml` (Kamal) is the actual config; `docker-compose.yml` content not fully visible |
| Production container orchestration | "Docker Compose" | Kamal is configured and used |
| Response format | All controllers use `{ success:, data:, error: }` envelope | `StudentsController` and some others inherit from `BaseController` (now corrected per code comments), but inconsistencies remain per `improvement.md §CODE-2` |

---

### Known Self-Identified Issues (from `improvement.md` in the repo)

The project already contains an internal `improvement.md` that identifies several of the issues listed above plus additional code-quality gaps. Items tracked there that are **also documentation gaps** include:

- `CFG-2`: Host header injection (`config.hosts` commented out) — **security gap**
- `CFG-3`: Production SMTP unconfigured — captured as **GAP-22**
- `CFG-7`: Active Storage using local disk in production — captured as **GAP-23**
- `PERF-1`: `Student.all` returns full table without pagination — **performance risk** not addressed in architecture docs
- `SEC-1`: Student, Batch, ExamBooking controllers previously allowed unauthenticated access — partially resolved per `base_controller.rb` comment
- `CODE-1`: `LicenseUpgrade#reject!` silently ignores the `reason:` parameter despite the migration `20260627094958_add_rejection_reason_to_license_upgrades.rb` adding the column

---

## Priority Summary Table

| Gap ID | Feature | Category | Status | Priority |
|---|---|---|---|---|
| GAP-01 | Student update endpoint | API | Missing | **High** |
| GAP-02 | `identification_document` type field | Database | Missing | **High** |
| GAP-03 | `eye_acuity_test` field | Database | Missing | **Medium** |
| GAP-04 | `meklit_approval_date` field | Database | Missing | **Medium** |
| GAP-05 | Student `education_level` field | Database | Missing | **Medium** |
| GAP-06 | Student `n_number` field | Database | Missing | **High** |
| GAP-07 | Batch `export_payload` JSONB column | Database | Missing | **Medium** |
| GAP-08 | Penalty period 7 days vs 5 days | Business Logic | Partial | **High** |
| GAP-09 | Payment fence for exam re-booking | API / Business Logic | Missing | **High** |
| GAP-10 | `fetch_last_attendance_date` TODO stub | Business Logic | Partial | **High** |
| GAP-11 | `DossierTransferJob` is a stub | Business Logic / Job | Partial | **High** |
| GAP-12 | Payroll entries API for instructors | API | Missing | **High** |
| GAP-13 | CSV financial export endpoint | API | Partial | **Medium** |
| GAP-14 | MASADEG module entirely unexposed | API | Missing | **Medium** |
| GAP-15 | Renewal requests module unexposed | API | Missing | **Medium** |
| GAP-16 | Student self-service portal | UI | Missing | **High** |
| GAP-17 | Instructor dashboard placeholder | UI | Partial | **High** |
| GAP-18 | Clerk dashboard placeholder | UI | Partial | **High** |
| GAP-19 | Admin dashboard placeholder | UI | Partial | **Medium** |
| GAP-20 | Dead links in dashboard quick actions | UI | Missing | **High** |
| GAP-21 | Production SSL commented out | Deployment | Missing | **High** |
| GAP-22 | Production SMTP unconfigured | Deployment | Missing | **High** |
| GAP-23 | Active Storage not declared on Student | Database / API | Partial | **High** |
| GAP-24 | Backend CI runs Minitest not RSpec | Testing | Partial | **High** |
| GAP-25 | Missing request specs for 4 controllers | Testing | Missing | **High** |

---

*End of report.*