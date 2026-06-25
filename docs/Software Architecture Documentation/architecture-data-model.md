# Architecture Data Model

## Database Architecture Overview

The data layer is powered by a PostgreSQL 16 database instance that ensures relational integrity through foreign keys and full transaction support for financial workflows. The schema consists of exactly 12 core tables designed to track the entire student lifecycle, training hours, financial milestones, and external licensing transmissions. Schema flexibility for variable metadata is achieved using PostgreSQL JSONB data columns.

## Core Relational Tables

### users

**Responsibility:** Stores system operators and controls access privileges

**Columns and Data Attributes:** Unique identifier, authentication credentials managed via Devise, token tracking attributes for JSON Web Tokens, and user roles for Role Based Access Control including Admin, Instructor, Clerk, and Student

### students

**Responsibility:** Main entity tracking student records and progression states

**Columns and Data Attributes:** Student identification details, minimum education level status, accepted identification document types, assigned instructor identifier, sub city residential registration string, and a state machine tracking status values including Registered, Queued For Meklit, Sent To Meklit, Approved, Rejected, Pending Original Verification, Theory Passed, Failed Practical Remedial, and Graduated

### batches

**Responsibility:** Manages the automated 15 day queue and export packages

**Columns and Data Attributes:** Batch identifier, 15 day cycle generation timestamps, execution tracking attributes, and student count summaries for the automated Meklit portal transmission packages

### attendance_logs

**Responsibility:** Enforces legal training minimums through daily verification logs

**Columns and Data Attributes:** Log identifier, student reference, instructor reference, training type toggle for theory or practical, training category tracking, daily digital signatures, timestamp markings, and verification metadata containing identity photos and phone numbers for both parties

### invoices

**Responsibility:** Handles all school billing operations and statutory penalty fines

**Columns and Data Attributes:** Invoice identifier, student reference, billing category, outstanding balances, payment status flags, and specific fee mappings matching fixed pricing metrics including Milestone 1 for registration, Milestone 2 for practical release, and 300 ETB government failure penalties

### courses

**Responsibility:** Configures core training category definitions and thresholds

**Columns and Data Attributes:** Course identifier, license category classification names such as Auto, Motorcycle, Public 1 Hizib 1, and Truck 1 Derek 1, minimum required days parameters, and baseline pricing values

### mock_tests

**Responsibility:** Evaluates student readiness through internal computer based testing

**Columns and Data Attributes:** Test identifier, student reference, total numeric score graded out of 50 points, status indicators showing pass for scores higher than 37 or fail for scores 37 and below, and re examination scheduling timestamps

### erta_exam_bookings

**Responsibility:** Orchestrates official testing coordination with the central Kality hub

**Columns and Data Attributes:** Booking identifier, student reference, official government testing ID known as the n number which serves as the unique key for all external coordination, test type designation for theory or practical, scheduled exam timestamps, and results entry attributes

### license_upgrades

**Responsibility:** Executes MASADEG progression tracks for professional drivers

**Columns and Data Attributes:** Upgrade identifier, student reference, verified Addis Ababa drivers license key, computed license age tracker ensuring the active lifespan exceeds 3 years, and target category fields

### payroll_entries

**Responsibility:** Monthly compensation ledger processing for school personnel

**Columns and Data Attributes:** Entry identifier, employee reference, base salary fields, active student load bonuses, verified training days counts, calculated monthly totals, and dispatch notification statuses

### graduation_records

**Responsibility:** Coordinates final offboarding workflows and file transfers

**Columns and Data Attributes:** Record identifier, student reference, compiled digital dossier archives, Kifle Ketema destination sub city assignments, file transfer verification timestamps, and final graduation confirmation flags

### renewal_requests

**Responsibility:** Manages independent external license renewal workflows

**Columns and Data Attributes:** Request identifier, driver applicant details, flat fee invoice links, medical validation fields for eyes and blood, and direct transmission status indicators to the destination sub city registry

## Domain Specific Data Mappings

### Mandatory Medical Fields

Medical tracking attributes are housed within the student and renewal tables to satisfy government mandates. These include strict character representations for Blood Type alongside specific evaluation scores for the Eye Acuity Test.

### The Timir Compound Metadata Flag

The system incorporates a specialized metadata format within the license upgrades and graduation tables. Upon validation of an upgrade track, the target payload combines previous categories with new classifications into a single database entry marked as Timir, formatting output strings such as `Auto and Derek 1 Combined` or `Auto and Hizib 1 Combined`.
