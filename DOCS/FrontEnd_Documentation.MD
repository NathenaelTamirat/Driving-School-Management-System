1. **Define the exact scope**

   * Confirm this is only the **admin UI** for adding students.
   * List the final student fields.
   * List the 5 upload slots:

     * profile photo
     * yellow card
     * 8th grade document
     * 10th grade document
     * 12th grade document
     * medical document
   * Decide which of these are required and which are optional.

2. **Map the backend contract first**

   * Define the Rails API endpoint for creating a student.
   * Decide the request format: `multipart/form-data`.
   * Decide the exact field names the frontend will send.
   * Decide how Rails will store:

     * student data
     * uploaded file paths
     * verification status
     * upload timestamp

3. **Set up the frontend project**

   * Create the Next.js app.
   * Install and configure Tailwind CSS.
   * Add shadcn components.
   * Add form libraries:

     * `react-hook-form`
     * `zod`
     * `@hookform/resolvers`
   * Add file preview/conversion packages if needed for PDFs and image handling.

4. **Create the admin entry page**

   * Build one admin page for “Add Student”.
   * Put all input fields on that page.
   * Use a clean layout with cards and sections.
   * Keep the page focused only on student creation.

5. **Build the student information form**

   * Add inputs for:

     * first name
     * middle name
     * last name
     * DOB
     * blood type
     * address
     * house number
     * kebele
     * wereda/subcity
     * city/town
     * student ID
     * document ID
     * verified
   * Make `student_id` behave according to your backend rule:

     * either admin-generated
     * or read-only if the backend generates it

6. **Add validation rules**

   * Require all mandatory fields.
   * Limit string lengths.
   * Validate DOB format.
   * Restrict blood type to valid values.
   * Validate uploaded file size.
   * Validate allowed file types.
   * Reject files that are too large or unsupported.

7. **Build the file upload section**

   * Create one upload control per document slot.
   * Show the selected file name.
   * Show file size.
   * Show upload status.
   * Allow replacing a file before submission.
   * Keep file handling separate from text inputs.

8. **Support scanned PDFs and image files**

   * Accept scanned PDFs and image uploads.
   * For PDF uploads, render a preview from the first page.
   * For image uploads, show a normal image preview.
   * Normalize uploaded files when needed so the UI can display them consistently.

9. **Handle document conversion carefully**

   * Convert supported PDFs to preview images in the browser.
   * Convert image files to `.jpg` or `.png` only when useful for preview or normalization.
   * Do not pretend every document can safely be converted in the frontend.
   * Keep unsupported document conversion for the Rails backend if needed.

10. **Add security protections**

    * Keep admin access behind authentication.
    * Validate every file on both frontend and backend.
    * Never trust frontend-only `verified` or upload state.
    * Send files using `FormData`, not base64.
    * Do not expose file paths directly in the UI.
    * Prepare for CSRF protection on the Rails side.

11. **Connect the form to the Rails API**

    * Submit the form as `multipart/form-data`.
    * Send student fields and files together.
    * Handle success and error responses clearly.
    * Show loading state during upload.
    * Reset the form only after a successful save.

12. **Store and display backend results**

    * Receive the created student response from Rails.
    * Show the created student record summary.
    * Show saved file names or statuses if returned by the backend.
    * Confirm whether the record is verified or pending.

13. **Add user feedback in the UI**

    * Show field-level errors.
    * Show file-specific errors.
    * Show a success message on completion.
    * Show a failure message if the backend rejects the submission.
    * Make missing document slots obvious.

14. **Test the full flow**

    * Test a valid student creation.
    * Test missing required text fields.
    * Test missing files.
    * Test PDF uploads.
    * Test image uploads.
    * Test oversized files.
    * Test corrupted files.
    * Test backend failure responses.
    * Test the form on mobile and desktop.

15. **Refine the UI**

    * Improve spacing and grouping.
    * Add clear labels and helper text.
    * Make the upload section easy to scan.
    * Make the “Submit” action obvious.
    * Remove anything not needed for admin data entry.

16. **Finalize for handoff**

    * Confirm all field names match Rails.
    * Confirm all file slots match the backend.
    * Confirm validation rules match backend rules.
    * Confirm the UI works with real scanned documents.
    * Freeze the final version for implementation.

