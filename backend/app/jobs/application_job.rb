class ApplicationJob < ActiveJob::Base
  retry_on ActiveRecord::Deadlocked, wait: :polynomially_longer, attempts: 5

  discard_on ActiveJob::DeserializationError do |job, error|
    Rails.logger.error "[ApplicationJob] Discarding #{job.class} — record gone: #{error.message}"
    Sentry.capture_exception(error, extra: { job_class: job.class.name, arguments: job.arguments })
  end
end
