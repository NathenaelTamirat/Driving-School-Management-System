# Class Design

## Service Object Architecture

The backend application utilizes the service object pattern to isolate complex business logic from the controller layer and model layer. Each service object maintains a single purpose and responsibility to guarantee clean input and output contracts across the platform. These design components are organized inside dedicated domain modules to provide strict structural separation.

### ERTA Engine Module Classes

- **ErtaEngine::EligibilityValidator:** This class executes validation rules checking the thirty five day and fifty two day statutory training completion metrics.
- **ErtaEngine::PenaltyEngine:** This class processes exam failure scenarios by calculating financial fine adjustments and coordinating remedial training durations.
- **ErtaEngine::Scheduler:** This class manages administrative slot bookings for official government testing schedules.

### Service Object Code Example

```ruby
module ErtaEngine
  class EligibilityValidator
    def initialize(student)
      @student = student
    end

    def validate
      # Checks continuous training clocks
    end
  end
end
```

## ActiveJob Background Workers

The background worker tier manages asynchronous operations and periodic cron jobs across different system modules.

- **MeklitBatchExportJob:** This background job sweeps pending records every fifteen days to compile the student export payload.
- **ErtaCountdownMonitorJob:** This routine runs daily to track student timeline progression and identify upcoming registration deadlines.
- **PenaltyInvoiceGeneratorJob:** This worker initializes a fine invoice and locks booking operations upon receiving an exam failure signal.
- **PayrollComputeJob:** This routine executes monthly to calculate baseline salaries and active load bonuses for driving school employees.
- **DossierTransferJob:** This job automates archive compilation and handles file distribution to the designated sub city portal upon graduation.

## Thin ActiveRecord Models

The system architecture uses thin ActiveRecord models exclusively for database access and data persistence. Domain rules and complex validations are offloaded to the service layer to avoid fat models. The main models include `User`, `Student`, `Batch`, `AttendanceLog`, `Invoice`, `Course`, `MockTest`, `ErtaExamBooking`, `LicenseUpgrade`, `PayrollEntry`, `GraduationRecord`, and `RenewalRequest`.

## Pundit Authorization Policies

Granular authorization gates protect system actions by verifying roles before executing business logic. The `StudentPolicy` class defines specific access permissions for creating and updating student records based on administrative status or instructor assignment.
