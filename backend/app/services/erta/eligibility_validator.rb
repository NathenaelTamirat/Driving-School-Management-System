# frozen_string_literal: true

module ERTA
  # Validates student eligibility for ERTA exam booking
  # Enforces 35-day theory and 52-day practical training requirements
  class EligibilityValidator
    attr_reader :student, :errors

    def initialize(student)
      @student = student
      @errors = []
    end

    # Main validation method - returns true if student is eligible
    def call
      validate_status
      validate_theory_completion
      validate_practical_completion
      validate_mock_test_score
      validate_documents

      errors.empty?
    end

    private

    # Validate student is in appropriate status for exam booking
    def validate_status
      unless student.exam_eligible?
        errors << "Student status '#{student.status}' is not eligible for exam booking. Must be 'exam_eligible'"
      end
    end

    # Validate 35-day theory training requirement
    def validate_theory_completion
      if student.theory_days_completed < 35
        errors << "Theory training incomplete: #{student.theory_days_completed}/35 days required"
      end
    end

    # Validate 52-day practical training requirement
    def validate_practical_completion
      if student.practical_days_completed < 52
        errors << "Practical training incomplete: #{student.practical_days_completed}/52 days required"
      end
    end

    # Validate mock test score requirement (minimum 38%)
    def validate_mock_test_score
      if student.mock_test_score <= 37
        errors << "Mock test score insufficient: #{student.mock_test_score}% (minimum 38% required)"
      end
    end

    # Validate required documents are present
    # TODO: Implement document validation once ActiveStorage is set up
    def validate_documents
      # Placeholder for document validation
      # Required documents: profile_photo, yellow_card, grade_8, grade_10, grade_12
    end
  end
end
