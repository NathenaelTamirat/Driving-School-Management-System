# frozen_string_literal: true

module Meklit
  # Validates student eligibility for batch export to ERTA
  # Ensures all required documents and conditions are met before submission
  class QualificationValidator
    # Required document types for ERTA submission
    REQUIRED_DOCUMENTS = %w[
      profile_photo
      yellow_card
      grade_8
      grade_10
      grade_12
    ].freeze

    # Valid student statuses for batch export
    VALID_STATUSES = %w[
      exam_eligible
      graduated
    ].freeze

    attr_reader :student, :errors

    def initialize(student)
      @student = student
      @errors = []
    end

    # Main validation method - returns true if student qualifies
    def call
      validate_status
      validate_documents
      validate_completion

      errors.empty?
    end

    private

    # Validate student is in an appropriate status for export
    def validate_status
      unless VALID_STATUSES.include?(student.status)
        errors << "Student status '#{student.status}' is not valid for export. Must be one of: #{VALID_STATUSES.join(', ')}"
      end
    end

    # Validate all required documents are present
    def validate_documents
      REQUIRED_DOCUMENTS.each do |doc_type|
        unless document_present?(doc_type)
          errors << "Missing required document: #{doc_type.humanize}"
        end
      end
    end

    # Validate training completion requirements
    def validate_completion
      if student.theory_days_completed < 35
        errors << "Theory training incomplete: #{student.theory_days_completed}/35 days completed"
      end

      if student.practical_days_completed < 52
        errors << "Practical training incomplete: #{student.practical_days_completed}/52 days completed"
      end

      if student.mock_test_score <= 37
        errors << "Mock test score insufficient: #{student.mock_test_score}% (minimum 38%)"
      end
    end

    # Check if a document type is present for the student via ActiveStorage.
    def document_present?(doc_type)
      student.respond_to?(doc_type) && student.send(doc_type).attached?
    end
  end
end
