# frozen_string_literal: true

# Throttle login and registration endpoints to prevent brute-force attacks.
# See https://github.com/rack/rack-attack

class Rack::Attack
  # Use Solid Cache (PostgreSQL-backed) so throttling works without Redis.
  Rack::Attack.cache.store = Rails.cache

  throttle("login/ip", limit: 10, period: 60) do |req|
    req.ip if req.path == "/api/v1/auth/login" && req.post?
  end

  throttle("register/ip", limit: 5, period: 60) do |req|
    req.ip if req.path == "/api/v1/auth/register" && req.post?
  end
end
