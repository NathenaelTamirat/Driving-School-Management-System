# Module Design Specifications

## Module 1: User Management and Role Based Access Control

This module provides the foundational infrastructure governing authentication, authorization, and structural access limits throughout the driving school platform.

### System Roles and Access Definitions

The system segregates permissions among four explicit system roles to ensure clean separation of duties:

**Administrator:** Holds absolute system privileges, including full system access and authorization to execute any backend or frontend operation.

**Instructor:** Authorized to manage daily student training logs, execute mock screening assessments, and review personal monthly payroll statements.

**Clerk:** Responsible for initial student registration, collection of financial tuition fees, and administrative booking of national government examinations.

**Student:** Granted strict read only access restricted exclusively to their personal training records and status timelines.

### Authentication Architecture

The system integrates Devise combined with the devise jwt gem to establish secure token based sessions:

1. A user submits their login credentials to the endpoint located at `POST /api/v1/auth/login`.
2. Devise intercepts and validates the credentials against the database records.
3. Upon validation, devise jwt creates a cryptographically signed JSON Web Token.
4. The client application receives and saves this token within local storage or a secure browser cookie.
5. Every subsequent client request appends the token inside the `Authorization Bearer` header.
6. The Ruby on Rails API layer verifies the token integrity for each request.
7. The system limits session lifespans using short lived access tokens restricted to a 1 hour expiration window alongside a token blacklist database table to invalidate tokens upon explicit logout.

### Authorization Architecture

Granular permission gates are enforced at the service and controller layers using Pundit policies. An example of this pattern is the Student Policy which contains the following authorization methods:

```ruby
class StudentPolicy < ApplicationPolicy
  def create?
    user.admin? || user.clerk?
  end
  
  def update?
    user.admin? || user.clerk? || record.instructor_id == user.id
  end
end
```

## Module 2: Student Onboarding and Meklit Gateway

This module manages identity verification, primary documentation collection, and initial compliance screenings before educational pathways begin.

### License Category Eligibility Profile: Auto

- **Vehicle Definition:** Less than or equal to 8 Seats.
- **Educational Threshold:** 4th Grade Certificate minimum.
- **Identification Documents:** National ID, Kebele ID, Passport, or Birth Certificate.
- **Mandatory Medical Data:** Blood Type registration and Eye Acuity Test results.
- **Total Price:** 26010 Birr.

### License Category Eligibility Profile: Motorcycle

- **Vehicle Definition:** Standard Motorcycle units.
- **Educational Threshold:** 4th Grade Certificate minimum.
- **Identification Documents:** National ID, Kebele ID, Passport, or Birth Certificate.
- **Mandatory Medical Data:** Blood Type registration and Eye Acuity Test results.
- **Total Price:** 13310 Birr.

### License Category Eligibility Profile: Public 1 (Hizib 1)

- **Vehicle Definition:** Less than or equal to 20 Seats.
- **Educational Threshold:** 10th Grade Certificate minimum.
- **Identification Documents:** National ID, Kebele ID, Passport, or Birth Certificate.
- **Mandatory Medical Data:** Blood Type registration and Eye Acuity Test results.
- **Total Price:** 31310 Birr.

### License Category Eligibility Profile: Truck 1 (Derek 1)

- **Vehicle Definition:** Freight and Dry Cargo transport vehicles.
- **Educational Threshold:** 10th Grade Certificate minimum.
- **Identification Documents:** National ID, Kebele ID, Passport, or Birth Certificate.
- **Mandatory Medical Data:** Blood Type registration and Eye Acuity Test results.
- **Total Price:** 29710 Birr.

### Meklit Integration and Batching Workflow

**15 Day Synchronization Cycle:** The platform locks newly input student records into a pending queue. Every 15 days, a cron based background task named `MeklitBatchExportJob` sweeps the queue, validates general student parameters, generates a combined data export payload, and changes the student states.

**State Machine Tracking:** Every profile tracks progress through linear states starting at `Registered`, advancing to `Queued For Meklit`, transitioning to `Sent To Meklit`, and resolving at `Approved` or `Rejected`.

**Exception and Rejection Handling:** If the government interface marks a transmission as `Rejected` due to document ambiguity, the platform logs a `Manual Document Validation` flag. The student record changes to `Pending Original Verification`, triggering an automated interface warning that requires a clerk to manually re scan and upload certified hardcopies.

## Module 3: Course and Attendance Management (LMS)

This module acts as the digital engine checking that mandatory training durations match state regulations prior to final test registration.

### Phase 1: Theoretical Training Engine

**Daily Sheet Locking:** The system runs automated procedures to lock the daily digital theory attendance registry. Students within the Auto and Motorcycle groupings must accumulate 15 separate days of verified attendance logs. Students within the Public 1 and Truck 1 groupings must accumulate 20 separate days of verified logs.

**Screening Evaluation:** Achieving the required theory days automatically unlocks an internal computer based mock examination screen.

**Performance Logic:** The mock exam scales to a maximum of 50 points. A final score higher than 37 updates the database state to `Theory Passed`, allowing the system to accept subsequent financial balances. A score equal to or lower than 37 routes the record to `Theory Remedial` status, halting progress until a retry is arranged.

### Phase 2: Practical Training Logistics

**Secure Digital Form:** Clearing the internal mock exam and resolving invoice requirements triggers the creation of a downloadable practical log document. This file contains the Student Name, Assigned Instructor Name, Identity Photos of both parties, Phone Numbers, and the chosen License Category.

**Peer to Peer Booking Engine:** The institution avoids dictating schedules. The module presents a shared calendar open to both the instructor and student. The platform registers any customized training block provided both accounts add their digital signatures to the slot.

**Mandatory Practical Clocks:**

- **Auto:** Requires a minimum of 20 verified practical log days.
- **Public 1 and Truck 1:** Requires a minimum of 35 verified practical log days.
- **Motorcycle:** Requires a minimum of 15 verified practical log days.

## Module 4: ERTA Testing and Scheduling Engine

This module enforces official time delays and coordinates regional test scheduling with the main government hub located in Kality.

### Statutory Training Clocks

The platform tracks time constraints directly from the official `Meklit Approval Date` timestamp. External exam booking functions remain strictly locked until the following windows close:

- **Auto and Motorcycle Categories:** Requires a minimum of 35 continuous calendar days.
- **Public 1 and Truck 1 Categories:** Requires a minimum of 52 continuous calendar days.

### The n number Assignment and Practical Testing Access

**Identification Entry:** As soon as the regulatory countdown clock expires, the system displays an administrative input entry field to save the unique government testing identifier known as the `n number`. This `n number` functions as the primary unique key for all government testing schedules.

**Safety Gatekeeping:** The system blocks clerks from scheduling a practical exam date until the student assigned instructor manually toggles an internal flag confirming the student is fully `Qualified`.

### Failures, Absences, and Remedial Penalty Engine

**Government Fine Policy:** If a student registers a failing score on an official exam or misses their assigned date, a penalty is triggered. The system stops the training track and outputs an internal invoice for 300 Birr designated for the ERTA Kality branch, applying to both theory and practical restarts.

**School Remedial Window:** Registering an official practical test failure updates the profile status to `Failed Practical Remedial`. The module creates a mandatory 5 day revision timeline and locks exam booking functions until an instructor logs targeted practice completion.

## Module 5: MASADEG Upgrade and Timir Rule Engine

This specialized module contains the business rules governing active drivers seeking an upgrade to higher professional tiers.

### Entry Rules and Validation Rules

**Direct Registration Allowances:** Applicants can register directly for Auto, Motorcycle, Truck 1, or Public 1 options without presenting a previous driving history. Higher tiers such as Public 2, Public 3, or Truck 2 remain locked unless a validated existing license key is supplied.

**Processing Rules:** The platform validates that the provided license was issued within Addis Ababa. The module calculates the exact age of the license and rejects the upgrade path if the active license lifespan is less than 3 years.

**The Timir Metadata Flag:** Once a driver completes a MASADEG upgrade course, the application merges the categories into a single entry flagged as `Timir` inside the ERTA payload, formatting the output as `Auto and Derek 1 Combined` or `Auto and Hizib 1 Combined`.

## Module 6: Finance and Payroll Module

This module tracks tuition payment milestones and automates monthly internal staff payouts.

### Tuition Billing Tracks

- **Milestone 1:** Collects the initial Registration and Theory Fee at onboarding.
- **Milestone 2:** Unlocks the Practical Fee Release immediately after the mock test updates to `Theory Passed`.

**Fixed Pricing Schema:** Auto maps to 26010.00 ETB, Truck 1 maps to 29710.00 ETB, Public 1 maps to 31310.00 ETB, and Motorcycle maps to 13310.00 ETB.

### Employee Payroll Engine

A recurring background routine named `PayrollComputeJob` runs at the end of each month to compute pay updates for instructors, clerks, and managers. The system calculates salaries by combining base pay, active student numbers, and active training days.

## Module 7: Graduation, Renewal, and File Transfer Module

This module compiles completed records and processes standalone licensing requests.

### Archive Transfer and Regional Matrix

**Kifle Ketema File Handover:** When a student passes both final examinations, the `DossierTransferJob` compiles the digital and physical archives and updates the status to `Transferred to Kifle Ketema` based on the student residential sub city choice.

**Authority Separation Matrix:** Future administrative changes, address updates, and normal multi year renewals route through the Kifle Ketema Sub City Subsystem, whereas the initial card printing remains managed by the central Kality ERTA Hub.

### License Validity Milestones

The system splits the structural 4 year lifespan of an issued driving license into two distinct operational segments:

- **Temporary License Window:** Governs the first 2 years of the license lifespan.
- **Permanent Replacement Window:** Governs the final 2 years of the license lifespan.

### Standalone License Renewal Subsystem

This specialized background pipeline allows external operators to request standard license renewals without undergoing the standard school training track. The process completely skips the learning management system logs, creates a flat fee renewal invoice, checks that current medical fields are saved, and routes the validated data directly to the client registered Kifle Ketema portal.
