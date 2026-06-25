# Database Design

## Database Architecture Overview

The system uses PostgreSQL 16 for persistent data storage. The design enforces relational integrity via foreign keys and provides transaction support for financial operations. The database utilizes JSONB columns for flexible metadata storage.

## Core Tables

The architecture defines 12 key tables to manage the system modules.

### 1. users

This table stores system operators and enforces Role Based Access Control.

- `id` Primary Key
- `role` Admin | Instructor | Clerk | Student

### 2. students

This table contains student records and tracks the state machine transitions.

- `id` Primary Key
- `license_category` Auto | Motorcycle | Public 1 | Truck 1
- `education_level` 4th Grade Certificate | 10th Grade Certificate
- `identification_document` National ID | Kebele ID | Passport | Birth Certificate
- `blood_type`
- `eye_acuity_test`
- `n_number`
- `status`
- `meklit_approval_date`

### 3. batches

This table manages the 15 day export cycles for Meklit integration.

- `id` Primary Key
- `export_payload` JSONB format

### 4. attendance_logs

This table stores daily training records for theoretical and practical sessions.

- `id` Primary Key
- `student_id` Foreign Key
- `instructor_id` Foreign Key
- `digital_signatures`

### 5. invoices

This table tracks payment milestones and ERTA penalty fines.

- `id` Primary Key
- `student_id` Foreign Key
- `amount` 26010 | 13310 | 31310 | 29710 | 300
- `milestone_type` Registration and Theory Fee | Practical Fee Release

### 6. courses

This table defines static course categories and required training thresholds.

- `id` Primary Key
- `required_theory_days` 15 or 20 days
- `required_practical_days` 15 | 20 | 35 days

### 7. mock_tests

This table records internal screening examinations.

- `id` Primary Key
- `student_id` Foreign Key
- `score` Maximum 50 points
- `passed` Evaluated based on score greater than 37

### 8. erta_exam_bookings

This table orchestrates official government examinations.

- `id` Primary Key
- `student_id` Foreign Key
- `n_number`

### 9. license_upgrades

This table stores MASADEG upgrade requests for experienced drivers.

- `id` Primary Key
- `student_id` Foreign Key
- `prior_license_key`
- `timir_compound_flag`

### 10. payroll_entries

This table manages monthly instructor compensation calculations.

- `id` Primary Key
- `base_pay`
- `active_student_loads`
- `active_training_days`

### 11. graduation_records

This table stores compiled graduate data for the final handover.

- `id` Primary Key
- `student_id` Foreign Key
- `destination_kifle_ketema`

### 12. renewal_requests

This table handles external driver renewals bypassing the learning management system.

- `id` Primary Key
- `medical_data_updated`
- `registered_kifle_ketema`
