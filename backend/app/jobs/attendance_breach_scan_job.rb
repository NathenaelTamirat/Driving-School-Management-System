# frozen_string_literal: true

# AttendanceBreachScanJob - Daily cron job to scan for attendance breaches
# Runs daily at 2:00 AM to check all active students for 7+ day attendance gaps
#
# Scheduled via: config/recurring.yml (Solid Queue)
# Calls: Finance::PenaltyEngine.scan_all_for_attendance_breaches
class AttendanceBreachScanJob < ApplicationJob
  queue_as :default

  # Retry configuration for failed jobs
  retry_on StandardError, wait: 5.minutes, attempts: 3

  def perform
    Rails.logger.info "AttendanceBreachScanJob started at #{Time.current}"
    
    results = Finance::PenaltyEngine.scan_all_for_attendance_breaches

    log_results(results)
    
    Rails.logger.info "AttendanceBreachScanJob completed at #{Time.current}"
  rescue StandardError => e
    Rails.logger.error "AttendanceBreachScanJob failed: #{e.class} - #{e.message}"
    Rails.logger.error e.backtrace.join("\n")
    raise # Re-raise to trigger retry mechanism
  end

  private

  def log_results(results)
    Rails.logger.info "Attendance Breach Scan Results:"
    Rails.logger.info "  - Students scanned: #{results[:scanned]}"
    Rails.logger.info "  - Penalties created: #{results[:penalties_created]}"
    
    if results[:errors].any?
      Rails.logger.warn "  - Errors encountered: #{results[:errors].count}"
      results[:errors].each do |error|
        Rails.logger.warn "    Student #{error[:student_id]}: #{error[:error]}"
      end
    end
  end
end
