# Be sure to restart your server when you modify this file.

# Avoid CORS issues when API is called from the frontend app.
# Handle Cross-Origin Resource Sharing (CORS) in order to accept cross-origin Ajax requests.

# Read more: https://github.com/cyu/rack-cors

Rails.application.config.middleware.insert_before 0, Rack::Cors do
  allow do
    # List every allowed origin explicitly. Separate multiple origins with commas.
    origins ENV.fetch("ALLOWED_ORIGINS", "http://localhost:3000").split(",")

    # Only applies to /api/* paths; health check at /up stays accessible.
    resource "/api/*",
      headers: :any,
      methods: [ :get, :post, :put, :patch, :delete, :options, :head ],
      credentials: true,
      max_age: 86400
  end
end
