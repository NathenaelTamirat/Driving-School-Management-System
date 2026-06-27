# frozen_string_literal: true

module Meklit
  # Handles ERTA approval/rejection responses for batch submissions
  # Updates batch status and processes student-level responses
  class ResponseHandler
    attr_reader :batch, :response_data, :logger

    def initialize(batch, response_data)
      @batch = batch
      @response_data = response_data
      @logger = Rails.logger
    end

    # Process the ERTA response and update batch status
    # Returns true if processing succeeded, false otherwise
    def call
      return false unless response_data_valid?

      case response_data[:status]
      when "approved"
        handle_approval
      when "rejected"
        handle_rejection
      when "partial"
        handle_partial_approval
      else
        logger.error "[ResponseHandler] Unknown response status: #{response_data[:status]}"
        false
      end
    end

    private

    # Validate the response data structure
    def response_data_valid?
      if response_data.nil?
        logger.error "[ResponseHandler] Response data is nil"
        return false
      end

      unless response_data.key?(:status)
        logger.error "[ResponseHandler] Response missing status field"
        return false
      end

      true
    end

    # Handle batch approval
    def handle_approval
      batch.update!(
        status: "approved",
        approved_at: Time.current,
        rejection_reason: nil
      )

      # Update all students in batch to graduated status
      batch.students.update_all(status: "graduated")

      # Send approval notification emails
      send_batch_approval_emails

      logger.info "[ResponseHandler] Batch #{batch.id} approved by ERTA"
      true
    rescue ActiveRecord::RecordInvalid => e
      logger.error "[ResponseHandler] Failed to approve batch: #{e.message}"
      false
    end

    # Handle batch rejection
    def handle_rejection
      rejection_reason = response_data[:reason] || "No reason provided"

      batch.update!(
        status: "rejected",
        rejection_reason: rejection_reason
      )

      # Optionally update student statuses back to exam_eligible
      batch.students.update_all(status: "exam_eligible")

      logger.warn "[ResponseHandler] Batch #{batch.id} rejected by ERTA: #{rejection_reason}"
      true
    rescue ActiveRecord::RecordInvalid => e
      logger.error "[ResponseHandler] Failed to reject batch: #{e.message}"
      false
    end

    # Handle partial approval (some students approved, some rejected)
    def handle_partial_approval
      batch.update!(
        status: "approved",
        approved_at: Time.current,
        rejection_reason: "Partial approval - see individual student responses"
      )

      # Process individual student responses
      process_student_responses if response_data[:students]

      logger.info "[ResponseHandler] Batch #{batch.id} partially approved by ERTA"
      true
    rescue ActiveRecord::RecordInvalid => e
      logger.error "[ResponseHandler] Failed to process partial approval: #{e.message}"
      false
    end

    # Process individual student responses from partial approval
    def process_student_responses
      response_data[:students].each do |student_response|
        student = batch.students.find_by(student_id: student_response[:student_id])
        next unless student

        if student_response[:status] == "approved"
          student.update!(status: "graduated")
          logger.info "[ResponseHandler] Student #{student.student_id} approved"
        else
          student.update!(status: "exam_eligible")
          logger.warn "[ResponseHandler] Student #{student.student_id} rejected: #{student_response[:reason]}"
        end
      end
    end

    # Send batch approval emails to admin and students
    def send_batch_approval_emails
      # Send to admin
      admin_email = ENV["ADMIN_EMAIL"] || "admin@drivingschool.et"
      MeklitMailer.batch_approval(batch, admin_email).deliver_later

      # Send to individual students
      batch.students.find_each do |student|
        student_email = student.email.presence or raise "Student #{student.student_id} has no email"
        MeklitMailer.student_approval(student, student_email).deliver_later
      end
    rescue StandardError => e
      logger.error "[ResponseHandler] Failed to send approval emails: #{e.message}"
      # Don't fail the process if emails fail
    end
  end
end
