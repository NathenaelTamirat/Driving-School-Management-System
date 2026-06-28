class ERTACountdownMonitorJob < ApplicationJob
  queue_as :default

  DAILY_CHECK_WINDOW = 5

  retry_on StandardError, wait: 5.minutes, attempts: 3

  def perform
    Rails.logger.info "ERTACountdownMonitorJob started at #{Time.current}"

    results = { checked: 0, approaching_deadline: 0, past_deadline: 0, errors: [] }

    Student.where(status: %w[theory_in_progress practical_in_progress]).find_each do |student|
      results[:checked] += 1
      check_student_deadlines(student, results)
    end

    Rails.logger.info "ERTACountdownMonitorJob completed: #{results[:checked]} checked, #{results[:approaching_deadline]} approaching, #{results[:past_deadline]} overdue"
  end

  private

  def check_student_deadlines(student, results)
    return unless student.meklit_approval_date

    days_elapsed = (Date.current - student.meklit_approval_date.to_date).to_i

    if student.status == "theory_in_progress"
      required = 35
    else
      required = 52
    end

    remaining = required - days_elapsed

    if remaining <= 0
      results[:past_deadline] += 1
      Rails.logger.warn "[CountdownMonitor] Student #{student.student_id} past #{required}-day deadline (#{days_elapsed} days elapsed)"
    elsif remaining <= DAILY_CHECK_WINDOW
      results[:approaching_deadline] += 1
      Rails.logger.info "[CountdownMonitor] Student #{student.student_id} approaching #{required}-day deadline: #{remaining} days remaining"
    end
  rescue StandardError => e
    results[:errors] << { student_id: student.id, error: e.message }
    Rails.logger.error "[CountdownMonitor] Error checking Student #{student.id}: #{e.message}"
  end
end
