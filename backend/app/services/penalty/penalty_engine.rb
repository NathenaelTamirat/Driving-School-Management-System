# frozen_string_literal: true

module Penalty
  # Calculates and applies penalties for exam failures
  # Handles penalty rules and student account updates
  class PenaltyEngine
    PENALTY_DAYS = 7 # Number of days penalty for failed exam

    attr_reader :student, :exam_booking, :logger

    def initialize(student, exam_booking)
      @student = student
      @exam_booking = exam_booking
      @logger = Rails.logger
    end

    # Apply penalty for failed exam
    # Returns true if penalty was applied successfully
    def apply_failure_penalty
      return false unless exam_booking.failed?

      logger.info "[PenaltyEngine] Applying penalty for student #{student.student_id}"

      # Calculate penalty end date
      penalty_end_date = calculate_penalty_end_date

      # Update student with penalty information
      student.update!(
        penalty_start_date: Time.current,
        penalty_end_date: penalty_end_date,
        penalty_reason: "Failed #{exam_booking.exam_type} exam on #{exam_booking.scheduled_date}",
        under_penalty: true
      )

      logger.info "[PenaltyEngine] Penalty applied until #{penalty_end_date}"
      true
    rescue ActiveRecord::RecordInvalid => e
      logger.error "[PenaltyEngine] Failed to apply penalty: #{e.message}"
      false
    end

    # Check if student is currently under penalty
    def self.under_penalty?(student)
      return false unless student.under_penalty?
      return false if student.penalty_end_date.nil?
      return false if student.penalty_end_date < Time.current

      true
    end

    # Clear penalty for a student
    def self.clear_penalty(student)
      student.update!(
        under_penalty: false,
        penalty_start_date: nil,
        penalty_end_date: nil,
        penalty_reason: nil
      )
    end

    private

    # Calculate penalty end date based on exam type
    def calculate_penalty_end_date
      case exam_booking.exam_type
      when 'theory'
        PENALTY_DAYS.days.from_now
      when 'practical'
        PENALTY_DAYS.days.from_now
      else
        7.days.from_now
      end
    end
  end
end
