# frozen_string_literal: true

# devise-jwt configuration.
# We use the Denylist revocation strategy: revoked (logged-out) tokens are
# recorded in the jwt_denylist table (see JwtDenylist model). A token is valid
# until it expires OR it appears in the denylist.
Devise.setup do |config|
  config.jwt do |jwt|
    # Falls back to secret_key_base so the app boots in dev/test without extra
    # setup; set DEVISE_JWT_SECRET_KEY explicitly in production.
    jwt.secret = ENV.fetch("DEVISE_JWT_SECRET_KEY") { Rails.application.secret_key_base }

    # Routes that mint a token (the token is also returned in the JSON body).
    jwt.dispatch_requests = [
      [ "POST", %r{^/api/v1/auth/login$} ],
      [ "POST", %r{^/api/v1/auth/register$} ]
    ]

    # Hitting this route with a valid token denylists it.
    jwt.revocation_requests = [
      [ "DELETE", %r{^/api/v1/auth/logout$} ]
    ]

    jwt.expiration_time = 1.hour.to_i
  end
end
