# frozen_string_literal: true

class MeklitMailer < ApplicationMailer
  default from: ENV['MAILER_FROM'] || 'noreply@drivingschool.et'

  # Send email when a batch is submitted to ERTA
  def batch_submission(batch, recipient_email)
    @batch = batch
    @student_count = batch.students.count
    @submission_date = batch.submitted_at

    mail(
      to: recipient_email,
      subject: "Batch #{@batch.name} Submitted to ERTA"
    )
  end

  # Send email when a batch is approved by ERTA
  def batch_approval(batch, recipient_email)
    @batch = batch
    @student_count = batch.students.count
    @approval_date = batch.approved_at

    mail(
      to: recipient_email,
      subject: "Batch #{@batch.name} Approved by ERTA"
    )
  end

  # Send email when a batch is rejected by ERTA
  def batch_rejection(batch, recipient_email)
    @batch = batch
    @rejection_reason = batch.rejection_reason
    @rejection_date = batch.submitted_at

    mail(
      to: recipient_email,
      subject: "Batch #{@batch.name} Rejected by ERTA"
    )
  end

  # Send email to individual student when they are approved
  def student_approval(student, recipient_email)
    @student = student
    @approval_date = student.batch.approved_at

    mail(
      to: recipient_email,
      subject: "Congratulations! Your Driving License Application is Approved"
    )
  end

  # Send email to student when their exam is booked
  def exam_booking(exam_booking, recipient_email)
    @exam_booking = exam_booking
    @student = exam_booking.student
    @exam_type = exam_booking.exam_type.humanize
    @scheduled_date = exam_booking.scheduled_date
    @venue = exam_booking.venue

    mail(
      to: recipient_email,
      subject: "Your #{@exam_type} Exam is Scheduled"
    )
  end

  # Send email to student with exam results
  def exam_result(exam_booking, recipient_email)
    @exam_booking = exam_booking
    @student = exam_booking.student
    @exam_type = exam_booking.exam_type.humanize
    @score = exam_booking.score
    @passed = exam_booking.passed?

    mail(
      to: recipient_email,
      subject: "Your #{@exam_type} Exam Results"
    )
  end
end
