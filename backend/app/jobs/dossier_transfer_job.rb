# frozen_string_literal: true

class DossierTransferJob < ApplicationJob
  queue_as :default

  def perform(student_id)
    student = Student.find(student_id)
    record  = student.graduation_record

    return unless record
    return if record.transferred?

    record.update!(dossier_status: "transferred")

    Rails.logger.info "[DossierTransferJob] Dossier marked transferred for student #{student_id}"
  rescue ActiveRecord::RecordNotFound
    Rails.logger.error "[DossierTransferJob] Student #{student_id} not found"
  end
end
