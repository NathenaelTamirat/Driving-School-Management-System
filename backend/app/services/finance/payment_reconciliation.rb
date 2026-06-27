# frozen_string_literal: true

module Finance
  # PaymentReconciliation - Daily payment reconciliation and verification
  # Matches student payments against invoices and identifies discrepancies
  #
  # Called by: PaymentReconciliationJob (daily) or manually by admin
  # Transaction boundary: Per-student verification
  class PaymentReconciliation
    class Error < StandardError; end

    attr_reader :start_date, :end_date, :results

    def initialize(start_date: Date.current, end_date: Date.current)
      @start_date = start_date
      @end_date = end_date
      @results = {
        total_students_checked: 0,
        discrepancies_found: 0,
        overpayments: [],
        underpayments: [],
        unmatched_payments: [],
        errors: []
      }
    end

    # Reconcile all student payments for the date range
    def reconcile_all
      Student.find_each do |student|
        @results[:total_students_checked] += 1
        reconcile_student(student)
      end

      log_results
      @results
    rescue StandardError => e
      @results[:errors] << "Batch reconciliation failed: #{e.message}"
      Rails.logger.error "PaymentReconciliation failed: #{e.class} - #{e.message}"
      @results
    end

    # Reconcile a single student's payments
    def reconcile_student(student)
      discrepancy = calculate_discrepancy(student)

      if discrepancy[:amount] > 0
        record_overpayment(student, discrepancy)
      elsif discrepancy[:amount] < 0
        record_underpayment(student, discrepancy)
      end

      check_unmatched_invoices(student)
    rescue StandardError => e
      @results[:errors] << "Student #{student.student_id}: #{e.message}"
    end

    # Calculate payment discrepancy for a student
    def calculate_discrepancy(student)
      expected = calculate_expected_amount(student)
      actual = calculate_actual_paid(student)
      
      {
        student_id: student.id,
        student_name: "#{student.first_name} #{student.last_name}",
        expected_amount: expected,
        actual_paid: actual,
        amount: actual - expected,
        discrepancy_type: determine_discrepancy_type(actual, expected)
      }
    end

    # Generate payment reconciliation report
    def generate_report
      {
        period: {
          start_date: @start_date,
          end_date: @end_date
        },
        summary: {
          total_students_checked: @results[:total_students_checked],
          discrepancies_found: @results[:discrepancies_found],
          total_overpayments: @results[:overpayments].sum { |o| o[:amount] },
          total_underpayments: @results[:underpayments].sum { |u| u[:amount].abs },
          unmatched_invoices: @results[:unmatched_payments].count
        },
        details: {
          overpayments: @results[:overpayments],
          underpayments: @results[:underpayments],
          unmatched_payments: @results[:unmatched_payments]
        },
        errors: @results[:errors],
        generated_at: Time.current
      }
    end

    private

    def calculate_expected_amount(student)
      # Calculate total expected from all paid invoices
      student.invoices.paid.sum(:amount)
    end

    def calculate_actual_paid(student)
      # If student has amount_paid field, use it
      # Otherwise calculate from paid invoices
      if student.respond_to?(:amount_paid) && student.amount_paid.present?
        student.amount_paid
      else
        # Fallback: sum all paid invoice amounts
        student.invoices.paid.sum(:amount)
      end
    end

    def determine_discrepancy_type(actual, expected)
      return 'matched' if actual == expected
      actual > expected ? 'overpayment' : 'underpayment'
    end

    def record_overpayment(student, discrepancy)
      @results[:discrepancies_found] += 1
      @results[:overpayments] << {
        student_id: discrepancy[:student_id],
        student_name: discrepancy[:student_name],
        student_code: student.student_id,
        amount: discrepancy[:amount],
        expected: discrepancy[:expected_amount],
        actual: discrepancy[:actual_paid],
        action_required: 'Verify overpayment or issue refund'
      }

      Rails.logger.warn "Overpayment detected: Student #{student.student_id} - #{discrepancy[:amount]} ETB"
    end

    def record_underpayment(student, discrepancy)
      @results[:discrepancies_found] += 1
      @results[:underpayments] << {
        student_id: discrepancy[:student_id],
        student_name: discrepancy[:student_name],
        student_code: student.student_id,
        amount: discrepancy[:amount],
        expected: discrepancy[:expected_amount],
        actual: discrepancy[:actual_paid],
        action_required: 'Follow up on outstanding payment'
      }

      Rails.logger.warn "Underpayment detected: Student #{student.student_id} - #{discrepancy[:amount].abs} ETB owed"
    end

    def check_unmatched_invoices(student)
      # Find invoices marked as paid but with no payment reference
      unmatched = student.invoices.paid.where(payment_reference: [nil, ''])
      
      unmatched.each do |invoice|
        @results[:unmatched_payments] << {
          invoice_id: invoice.id,
          student_id: student.id,
          student_name: "#{student.first_name} #{student.last_name}",
          student_code: student.student_id,
          invoice_type: invoice.milestone_type,
          amount: invoice.amount,
          paid_at: invoice.paid_at,
          action_required: 'Add payment reference or verify payment'
        }
      end
    end

    def log_results
      Rails.logger.info "Payment Reconciliation Report (#{@start_date} to #{@end_date}):"
      Rails.logger.info "  - Students checked: #{@results[:total_students_checked]}"
      Rails.logger.info "  - Discrepancies found: #{@results[:discrepancies_found]}"
      Rails.logger.info "  - Overpayments: #{@results[:overpayments].count}"
      Rails.logger.info "  - Underpayments: #{@results[:underpayments].count}"
      Rails.logger.info "  - Unmatched invoices: #{@results[:unmatched_payments].count}"
    end
  end
end
