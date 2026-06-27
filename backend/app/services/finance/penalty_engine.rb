# frozen_string_literal: true

module Finance
  # PenaltyEngine - Rule-based penalty invoice generation
  # Scans for attendance breaches and exam failures, generates penalty invoices
  #
  # Called by: AttendanceBreachScanJob (daily cron) and exam result callbacks
  # Transaction boundary: Independent (idempotent per penalty type)
  class PenaltyEngine
    class Error < StandardError; end
    
    ATTENDANCE_BREACH_PENALTY = 50.00  # 50 ETB per attendance breach
    EXAM_FAILURE_FIRST_PENALTY = 300.00  # 300 ETB for first exam failure
    EXAM_FAILURE_SECOND_PENALTY = 500.00  # 500 ETB for second exam failure
    ATTENDANCE_GAP_DAYS = 7  # 7+ days without attendance = breach

    attr_reader :student, :results

    def initialize(student)
      @student = student
      @results = []
    end

    # Scan for attendance breach (7+ days gap)
    # Returns: { success: true/false, invoice: Invoice|nil, errors: [] }
    def check_attendance_breach
      return skip_result('Student not in active training') unless in_active_training?
      return skip_result('Attendance breach penalty already issued') if attendance_penalty_exists?

      last_attendance = fetch_last_attendance_date
      return skip_result('No attendance records found') unless last_attendance

      days_gap = (Date.current - last_attendance).to_i
      return skip_result("No breach detected (gap: #{days_gap} days)") if days_gap < ATTENDANCE_GAP_DAYS

      invoice = create_attendance_penalty_invoice(days_gap)
      success_result(invoice, "Attendance breach penalty created (#{days_gap} days gap)")
    rescue StandardError => e
      error_result("Attendance breach check failed: #{e.message}")
    end

    # Generate exam failure penalty based on attempt count
    # attempt_number: 1 (first failure = 300 ETB) or 2 (second failure = 500 ETB)
    def generate_exam_failure_penalty(attempt_number)
      return skip_result('Invalid attempt number') unless [1, 2].include?(attempt_number)
      return skip_result("Exam failure penalty already issued for attempt #{attempt_number}") if exam_penalty_exists?(attempt_number)

      amount = attempt_number == 1 ? EXAM_FAILURE_FIRST_PENALTY : EXAM_FAILURE_SECOND_PENALTY
      invoice = create_exam_failure_penalty_invoice(attempt_number, amount)
      success_result(invoice, "Exam failure penalty created for attempt #{attempt_number}")
    rescue StandardError => e
      error_result("Exam failure penalty generation failed: #{e.message}")
    end

    # Batch scan: check all students for attendance breaches (called by cron job)
    def self.scan_all_for_attendance_breaches
      results = { scanned: 0, penalties_created: 0, errors: [] }
      
      Student.where(status: [:theory_in_progress, :practical_in_progress]).find_each do |student|
        results[:scanned] += 1
        
        engine = new(student)
        result = engine.check_attendance_breach
        
        results[:penalties_created] += 1 if result[:success]
        results[:errors] << { student_id: student.id, error: result[:errors] } if result[:errors].any?
      end

      Rails.logger.info "AttendanceScan: #{results[:scanned]} students scanned, #{results[:penalties_created]} penalties created"
      results
    rescue StandardError => e
      Rails.logger.error "AttendanceScan batch failed: #{e.class} - #{e.message}"
      results[:errors] << { batch_error: e.message }
      results
    end

    private

    def in_active_training?
      %w[theory_in_progress practical_in_progress].include?(student.status)
    end

    def attendance_penalty_exists?
      Invoice.exists?(
        student: student,
        invoice_type: 'penalty',
        status: %w[pending paid],
        metadata: { penalty_reason: 'attendance_breach' }
      )
    end

    def exam_penalty_exists?(attempt_number)
      Invoice.exists?(
        student: student,
        invoice_type: 'penalty',
        status: %w[pending paid],
        metadata: { penalty_reason: 'exam_failure', attempt_number: attempt_number }
      )
    end

    def fetch_last_attendance_date
      # TODO: Replace with actual Attendance model query when implemented
      # For now, return a mock date or nil
      # Attendance.where(student: student).order(date: :desc).first&.date
      
      # Mock implementation - replace when Attendance model is available
      student.updated_at.to_date
    end

    def create_attendance_penalty_invoice(days_gap)
      Invoice.create!(
        student: student,
        invoice_type: 'penalty',
        amount: ATTENDANCE_BREACH_PENALTY,
        due_date: 14.days.from_now,
        status: 'pending',
        description: "Attendance breach penalty - #{days_gap} days without attendance",
        metadata: {
          generated_by: 'penalty_engine',
          penalty_reason: 'attendance_breach',
          days_gap: days_gap,
          last_attendance_date: fetch_last_attendance_date&.iso8601,
          generated_at: Time.current.iso8601
        }
      )
    end

    def create_exam_failure_penalty_invoice(attempt_number, amount)
      Invoice.create!(
        student: student,
        invoice_type: 'penalty',
        amount: amount,
        due_date: 14.days.from_now,
        status: 'pending',
        description: "Exam failure penalty - Attempt #{attempt_number} (#{amount} ETB)",
        metadata: {
          generated_by: 'penalty_engine',
          penalty_reason: 'exam_failure',
          attempt_number: attempt_number,
          generated_at: Time.current.iso8601
        }
      )
    end

    def success_result(invoice, message)
      { success: true, invoice: invoice, message: message, errors: [] }
    end

    def skip_result(message)
      { success: false, invoice: nil, message: message, errors: [] }
    end

    def error_result(error_message)
      Rails.logger.error "PenaltyEngine error for Student ##{student.id}: #{error_message}"
      { success: false, invoice: nil, message: nil, errors: [error_message] }
    end
  end
end
