# frozen_string_literal: true

module Graduation
  # Validates that a student meets all conditions for graduation:
  # status must be "exam_eligible", must have a passed practical exam,
  # and must not be under an active penalty.
  class EligibilityValidator
    attr_reader :student, :errors

    def initialize(student)
      @student = student
      @errors  = []
    end

    def call
      validate_status
      validate_passed_practical_exam
      validate_no_active_penalty

      errors.empty?
    end

    private

    def validate_status
      unless student.exam_eligible?
        errors << "Student status '#{student.status}' is not eligible for graduation. Must be 'exam_eligible'"
      end
    end

    def validate_passed_practical_exam
      passed = student.exam_bookings
                      .where(exam_type: "practical", status: "completed")
                      .where("score >= ?", ExamBooking::PASSING_SCORE)
                      .exists?

      errors << "No passed practical exam found" unless passed
    end

    def validate_no_active_penalty
      if student.under_penalty_active?
        errors << "Student is under an active penalty and cannot graduate until #{student.penalty_end_date&.to_date}"
      end
    end
  end
end
