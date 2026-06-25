# Testing Strategy

## Testing Architecture and Methodology

The system utilizes a multi tiered testing strategy to verify the stability isolation and reliability of the modular monolith architecture. Testing is split between backend verification using RSpec and frontend testing using Jest and React Testing Library to match the technology stack.

## Backend Testing Layers

The Ruby on Rails application uses RSpec to enforce business rules across all isolated service modules.

### 1. Unit Tests

- **Service Objects:** Every service object within the domain modules has a dedicated spec file. For example the `ErtaEngine::EligibilityValidator` test suite ensures that students cannot book an exam before the statutory thirty five day or fifty two day windows expire.
- **ActiveRecord Models:** Core model tests validate schema constraints, data types, default values, and state machine boundaries without executing heavy business logic.

### 2. Request Specs

- Request specs target endpoints inside the `api/v1` namespace.
- These specs verify that the application correctly intercepts requests, validates JSON Web Tokens, and enforces Pundit policies.
- Test cases specifically confirm that unauthorized tokens return an HTTP `Unauthorized` status and restricted role actions return an HTTP `Forbidden` status.

### 3. Asynchronous Worker Specs

- Testing suites verify that ActiveJob workers queue correctly and execute safely.
- The `MeklitBatchExportJob` spec verifies that the routine runs every fifteen days, aggregates pending records, and constructs the precise JSONB payload required by the regulatory system.
- The `PayrollComputeJob` spec validates that employee earnings calculations precisely tally baseline salaries and active student load numbers at the end of the month.

## Frontend Testing Layers

The Next js application utilizes isolated testing suites to verify user interface reliability before deployment.

### 1. Component Unit Tests

- React components are tested using Jest to ensure proper rendering, state management, and hook execution.
- Form validation components are thoroughly verified to ensure they block invalid inputs before transmitting data to the Rails API.

### 2. Role Based Integration Tests

- Integration tests simulate user workflows across different system interfaces.
- Test suites verify that students only receive read only dashboard layouts while clerks, instructors, and administrators are presented with their respective operational tools.

## Critical Test Scenarios Matrix

| Domain Module | Component Under Test | Expected Behavior |
|---|---|---|
| Meklit Integration | `MeklitBatchExportJob` | Compiles student profiles into a batch, changes status to Sent To Meklit, and handles rejections by reverting profiles to Pending Original Verification. |
| Learning Management | Mock Examination Screen | Unlocks only after minimum attendance logs are met. Marks scores higher than 37 as Theory Passed and routes lower scores to Theory Remedial. |
| ERTA Engine | Countdown and Fine Automation | Enforces thirty five and fifty two day scheduling locks. Generates a three hundred Birr fine invoice immediately upon an exam failure or absence record. |
| Finance and Payroll | `PayrollComputeJob` | Processes monthly database sweeps to calculate base salaries and student load bonuses for system operators. |
| Graduation and File Transfer | `DossierTransferJob` | Collects digital archives, marks status as Transferred to Kifle Ketema, and routes historical data based on the sub city selection. |
