# frozen_string_literal: true

# Revoked JWTs for the devise-jwt Denylist strategy (see config/initializers/devise_jwt.rb).
class JwtDenylist < ApplicationRecord
  include Devise::JWT::RevocationStrategies::Denylist

  self.table_name = "jwt_denylist"

  # Periodic cleanup of expired tokens (safe to call from a scheduled job).
  def self.cleanup_expired_tokens
    where("exp < ?", Time.current).delete_all
  end
end
