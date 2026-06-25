# Architecture Context

## System Context Summary

The system operates as a central platform managing driving school operations. It bridges the gap between internal student training workflows and official government licensing requirements by interacting with specific regional authorities and user roles.

## User Roles and Actors

The application enforces strict Role Based Access Control defining four primary actors who interact with the frontend interface.

- **Admin:** Possesses full system access to oversee all modules and data.
- **Instructor:** Interacts with the system to log daily training attendance, trigger mock tests, and view personal monthly payroll entries.
- **Clerk:** Facilitates daily business operations by handling student registration, processing financial invoices, and orchestrating official exam bookings.
- **Student:** Interacts with the system in a read only capacity to monitor personal training progress, exam results, and graduation status.

## External Integrations and Entities

The system architecture defines specific data boundaries and interactions with external regulatory bodies and systems.

- **ERTA:** The system validates student eligibility against external ERTA rules regarding 35 day and 52 day training periods. It also coordinates official exam bookings and enforces external penalty rules requiring 300 ETB and a 5 day remedial period upon exam failure.
- **Meklit:** The application interacts with Meklit by generating and exporting batch payloads every 15 days to validate student qualifications.
- **Kifle Ketema:** The external local district office that receives physical and digital student dossiers. The Graduation Module executes a file transfer service to this entity once a student successfully completes the program.

## High Level Business Flow

The context of the system is defined by a lifecycle flow that moves between internal tracking and external approval.

1. Registration initiates an export to the Meklit Batch process.
2. Following ERTA Approval, the student undergoes internal LMS Training and Mock Tests.
3. The system orchestrates the ERTA Exam Booking.
4. Passing the external exam triggers the Graduation Module to execute the Dossier Transfer to Kifle Ketema.
