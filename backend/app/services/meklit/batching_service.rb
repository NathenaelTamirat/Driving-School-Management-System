# frozen_string_literal: true

module Meklit
  # Orchestrates the batch export process to ERTA
  # Validates students, generates payload, submits to API, and handles responses
  class BatchingService
    attr_reader :batch, :logger

    def initialize(batch)
      @batch = batch
      @logger = Rails.logger
    end

    # Execute the complete batch export process
    # Returns a hash with success status and any errors
    def call
      return error_result('Batch already submitted') if batch.submitted?
      return error_result('Batch already approved') if batch.approved?

      logger.info "[BatchingService] Starting batch export for batch #{batch.id}"

      # Step 1: Validate all students in batch
      unless validate_students
        return error_result('Student validation failed')
      end

      # Step 2: Generate payload
      payload = generate_payload
      logger.info "[BatchingService] Payload generated for #{batch.students.count} students"

      # Step 3: Submit to ERTA API
      api_response = submit_to_api(payload)
      unless api_response[:success]
        return error_result("API submission failed: #{api_response[:error]}")
      end

      # Step 4: Update batch status
      batch.update!(status: 'submitted', submitted_at: Time.current)
      logger.info "[BatchingService] Batch #{batch.id} successfully submitted to ERTA"

      # Step 5: Send submission notification email
      send_submission_email

      # Step 6: Schedule response check job
      schedule_response_check

      { success: true, batch_id: batch.id, api_response: api_response }
    rescue StandardError => e
      logger.error "[BatchingService] Error during batch export: #{e.message}"
      logger.error e.backtrace.join("\n")
      error_result("Unexpected error: #{e.message}")
    end

    private

    # Validate all students in the batch
    def validate_students
      validator = QualificationValidator
      invalid_students = []

      batch.students.find_each do |student|
        unless validator.new(student).call
          invalid_students << student.student_id
          logger.warn "[BatchingService] Student #{student.student_id} failed validation"
        end
      end

      if invalid_students.any?
        logger.error "[BatchingService] #{invalid_students.count} students failed validation"
        false
      else
        logger.info "[BatchingService] All #{batch.students.count} students validated"
        true
      end
    end

    # Generate the API payload
    def generate_payload
      PayloadGenerator.new(batch).generate
    end

    # Submit payload to ERTA API
    def submit_to_api(payload)
      api_client = MeklitApiClient.new
      api_client.submit_batch(payload)
    end

    # Schedule a background job to check for ERTA response
    def schedule_response_check
      # Schedule the job to run after a delay (e.g., 5 minutes)
      MeklitBatchExportJob.set(wait: 5.minutes).perform_later(batch.id)
      logger.info "[BatchingService] Response check scheduled for batch #{batch.id}"
    end

    # Send batch submission notification email
    def send_submission_email
      admin_email = ENV['ADMIN_EMAIL'] || 'admin@drivingschool.et'
      MeklitMailer.batch_submission(batch, admin_email).deliver_later
      logger.info "[BatchingService] Submission email sent for batch #{batch.id}"
    rescue StandardError => e
      logger.error "[BatchingService] Failed to send submission email: #{e.message}"
      # Don't fail the process if email fails
    end

    # Return error result hash
    def error_result(message)
      { success: false, error: message, batch_id: batch.id }
    end
  end
end
