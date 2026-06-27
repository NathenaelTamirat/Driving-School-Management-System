# frozen_string_literal: true

# Centralised error tracking via Sentry.
# Set SENTRY_DSN in the production environment to enable.
# Traces sample at 10% to stay within the free tier quota.

if ENV["SENTRY_DSN"].present?
  Sentry.init do |config|
    config.dsn = ENV["SENTRY_DSN"]
    config.breadcrumbs_logger = [:active_support_logger, :http_logger]
    config.traces_sample_rate = 0.1
  end
end
