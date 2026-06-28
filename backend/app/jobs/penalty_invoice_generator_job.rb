class PenaltyInvoiceGeneratorJob < ApplicationJob
  queue_as :default

  retry_on StandardError, wait: 10.minutes, attempts: 3

  def perform(student_id:, penalty_type:, attempt_number: nil, metadata: {})
    student = Student.find(student_id)

    case penalty_type.to_s
    when "exam_failure"
      generate_exam_failure_penalty(student, attempt_number, metadata)
    when "attendance_breach"
      generate_attendance_breach_penalty(student, metadata)
    else
      Rails.logger.error "[PenaltyInvoiceGeneratorJob] Unknown penalty type: #{penalty_type}"
    end
  rescue ActiveRecord::RecordNotFound => e
    Rails.logger.error "[PenaltyInvoiceGeneratorJob] Student #{student_id} not found: #{e.message}"
  end

  private

  def generate_exam_failure_penalty(student, attempt_number, metadata)
    return unless attempt_number.present?

    amount = attempt_number == 1 ? 300 : 500
    description = "ERTA exam failure penalty - Attempt #{attempt_number} (#{amount} ETB)"

    invoice = Invoice.create!(
      student: student,
      milestone_type: Invoice::MILESTONE_TYPES[:government_penalty],
      amount: amount,
      due_date: 14.days.from_now,
      status: "pending",
      description: description,
      metadata: metadata.merge(
        generated_by: "penalty_invoice_generator_job",
        penalty_reason: "exam_failure",
        attempt_number: attempt_number
      )
    )

    student.fail_practical_exam! if student.may_fail_practical_exam?
    student.update!(under_penalty: true, penalty_start_date: Time.current, penalty_end_date: 5.days.from_now)

    Rails.logger.info "[PenaltyInvoiceGeneratorJob] Created exam failure penalty invoice ##{invoice.id} for Student #{student.student_id}"
  rescue AASM::InvalidTransition => e
    Rails.logger.warn "[PenaltyInvoiceGeneratorJob] State transition skipped: #{e.message}"
  end

  def generate_attendance_breach_penalty(student, metadata)
    amount = 50
    description = "Attendance breach penalty - 7+ days without attendance"

    invoice = Invoice.create!(
      student: student,
      milestone_type: Invoice::MILESTONE_TYPES[:government_penalty],
      amount: amount,
      due_date: 14.days.from_now,
      status: "pending",
      description: description,
      metadata: metadata.merge(
        generated_by: "penalty_invoice_generator_job",
        penalty_reason: "attendance_breach"
      )
    )

    Rails.logger.info "[PenaltyInvoiceGeneratorJob] Created attendance breach penalty invoice ##{invoice.id} for Student #{student.student_id}"
  end
end
