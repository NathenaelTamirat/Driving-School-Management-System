# frozen_string_literal: true

# PaymentReconciliationJob - Daily payment reconciliation check
# Runs daily at 11:00 PM to reconcile all payments for the day
#
# Scheduled via: config/recurring.yml (Solid Queue)
# Calls: Finance::PaymentReconciliation
class PaymentReconciliationJob < ApplicationJob
  queue_as :default

  # Retry configuration for failed jobs
  retry_on StandardError, wait: 10.minutes, attempts: 3

  def perform(date: Date.current)
    Rails.logger.info "PaymentReconciliationJob started for #{date}"
    
    reconciliation = Finance::PaymentReconciliation.new(
      start_date: date,
      end_date: date
    )
    
    results = reconciliation.reconcile_all
    report = reconciliation.generate_report

    log_results(report)
    notify_if_discrepancies(report)
    
    Rails.logger.info "PaymentReconciliationJob completed for #{date}"
    
    results
  rescue StandardError => e
    Rails.logger.error "PaymentReconciliationJob failed: #{e.class} - #{e.message}"
    Rails.logger.error e.backtrace.join("\n")
    raise # Re-raise to trigger retry mechanism
  end

  private

  def log_results(report)
    Rails.logger.info "Payment Reconciliation Report:"
    Rails.logger.info "  Period: #{report[:period][:start_date]} to #{report[:period][:end_date]}"
    Rails.logger.info "  Students checked: #{report[:summary][:total_students_checked]}"
    Rails.logger.info "  Discrepancies found: #{report[:summary][:discrepancies_found]}"
    Rails.logger.info "  Total overpayments: #{report[:summary][:total_overpayments]} ETB"
    Rails.logger.info "  Total underpayments: #{report[:summary][:total_underpayments]} ETB"
    Rails.logger.info "  Unmatched invoices: #{report[:summary][:unmatched_invoices]}"
  end

  def notify_if_discrepancies(report)
    return unless report[:summary][:discrepancies_found] > 0

    # TODO: Send email notification to finance admin
    # FinanceMailer.reconciliation_alert(report).deliver_later
    
    Rails.logger.warn "⚠️  Payment discrepancies detected! Finance admin should review."
  end
end
