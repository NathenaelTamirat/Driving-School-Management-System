# UI-UX Design Documentation

## Frontend Framework and Architecture

The frontend delivers the user interface tailored for all roles and utilizes the Next js App Router. The application manages client side routing and state management while consuming the backend REST API via an HTTP client. Reusable UI components are stored within the `frontend/src/components` directory. Custom React hooks are maintained in the `hooks` directory to handle form validation and specialized user experience flows.

## Role Based Interface Delivery

The system provides distinct user interfaces based on the four primary system roles.

- **Administrator Interface:** Provides full system access to oversee all operations.
- **Instructor Interface:** Displays dedicated views to manage daily student training logs, execute mock screening assessments, and review personal monthly payroll statements.
- **Clerk Interface:** Presents screens for initial student registration, collection of financial tuition fees, and administrative booking of national government examinations.
- **Student Interface:** Provides a strictly read only dashboard restricted to personal training records and status timelines.

## Specific User Experience Workflows

- **Exception Handling Warning:** If the external Meklit portal rejects a profile, the software triggers an automated interface warning. This warning requires the clerk to manually re scan and upload certified hardcopies to the interface.
- **LMS Mock Testing Dashboard:** Upon completion of required theoretical days, the interface unlocks an internal computer based mock examination screen for the student to complete.
- **Practical Training Shared Calendar:** The platform presents a shared scheduling calendar accessible by both the assigned instructor and the student. The interface accepts any booking window provided both users digitally sign the slot.
- **Administrative Data Entry:** Once the statutory training clock expires, the system displays an administrative input entry field for the clerk to input the unique testing ID sent by ERTA.
- **Practical Exam Gatekeeping Toggle:** The interface blocks administration personnel from scheduling a practical test until the assigned instructor explicitly toggles a digital declaration flag confirming the student is `Qualified`.

## Form Validation and Error Handling

The frontend executes form validation before submitting data to the API. When the backend returns validation errors or HTTP status codes like `Bad Request`, the UI parses the structured JSON payload to display human readable error messages.
