# frozen_string_literal: true

module Graduation
  # Orchestrates the full graduation workflow:
  # 1. Checks eligibility via EligibilityValidator
  # 2. Transitions student to "graduated" AASM state
  # 3. Creates a GraduationRecord (dossier_status: "compiling")
  # 4. Enqueues DossierTransferJob to push the dossier to ERTA
  class Processor
    attr_reader :student, :errors

    def initialize(student)
      @student = student
      @errors  = []
    end

    def call
      validator = EligibilityValidator.new(student)

      unless validator.call
        @errors = validator.errors
        return false
      end

      ActiveRecord::Base.transaction do
        student.graduate!
        create_graduation_record
      end

      DossierTransferJob.perform_later(student.id)

      true
    rescue AASM::InvalidTransition => e
      @errors << "Cannot graduate student: #{e.message}"
      false
    rescue ActiveRecord::RecordNotUnique
      @errors << "Student already has a graduation record"
      false
    rescue ActiveRecord::RecordInvalid => e
      @errors = e.record.errors.full_messages
      false
    end

    private

    def create_graduation_record
      GraduationRecord.create!(
        student:              student,
        graduation_date:      Date.today,
        dossier_status:       "compiling",
        transfer_destination: "Kifle Ketema Sub-City"
      )
    end
  end
end
