# frozen_string_literal: true

# PayrollComputeJob - Monthly cron job to calculate instructor payroll
# Runs on the 1st day of each month at 3:00 AM to calculate previous month's payroll
#
# Scheduled via: config/recurring.yml (Solid Queue)
# Calls: Finance::PayrollCalculator.calculate_all_for_month
class PayrollComputeJob < ApplicationJob
  queue_as :default

  # Retry configuration for failed jobs
  retry_on StandardError, wait: 10.minutes, attempts: 3

  # Calculate payroll for the previous month
  # Example: On Jan 1st, calculates payroll for December
  def perform(month: nil, year: nil)
    target_date = if month && year
                    Date.new(year, month, 1)
                  else
                    Date.current.last_month
                  end

    target_month = target_date.month
    target_year = target_date.year

    Rails.logger.info "PayrollComputeJob started at #{Time.current} for #{target_month}/#{target_year}"
    
    results = Finance::PayrollCalculator.calculate_all_for_month(
      month: target_month,
      year: target_year
    )

    log_results(results, target_month, target_year)
    
    Rails.logger.info "PayrollComputeJob completed at #{Time.current}"
  rescue StandardError => e
    Rails.logger.error "PayrollComputeJob failed: #{e.class} - #{e.message}"
    Rails.logger.error e.backtrace.join("\n")
    raise # Re-raise to trigger retry mechanism
  end

  private

  def log_results(results, month, year)
    Rails.logger.info "Payroll Compute Results (#{month}/#{year}):"
    Rails.logger.info "  - Instructors processed: #{results[:processed]}"
    Rails.logger.info "  - Payroll entries created: #{results[:created]}"
    Rails.logger.info "  - Skipped (duplicates): #{results[:skipped]}"
    
    if results[:errors].any?
      Rails.logger.warn "  - Errors encountered: #{results[:errors].count}"
      results[:errors].each do |error|
        if error[:instructor_id]
          Rails.logger.warn "    Instructor #{error[:instructor_id]}: #{error[:errors].join(', ')}"
        elsif error[:batch_error]
          Rails.logger.error "    Batch error: #{error[:batch_error]}"
        end
      end
    end
  end
end
