# frozen_string_literal: true

class JwtCleanupJob < ApplicationJob
  queue_as :default

  def perform
    deleted = JwtDenylist.cleanup_expired_tokens
    logger.info "[JwtCleanupJob] Purged #{deleted} expired tokens from denylist"
  end
end
