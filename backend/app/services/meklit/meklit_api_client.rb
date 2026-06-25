# frozen_string_literal: true

module Meklit
  # HTTP client for communicating with the Meklit/ERTA API
  # Handles authentication, request formatting, and response parsing
  class MeklitApiClient
    BASE_URL = ENV["MEKLIT_API_BASE_URL"] || "https://api.meklit.gov.et"
    API_KEY = ENV["MEKLIT_API_KEY"]
    API_VERSION = "v1"

    attr_reader :logger

    def initialize(logger: Rails.logger)
      @logger = logger
    end

    # Submit a batch to ERTA for processing
    # Returns a hash with success status and response data
    def submit_batch(payload)
      post("/batches", payload)
    end

    # Check the status of a previously submitted batch
    def check_batch_status(batch_id)
      get("/batches/#{batch_id}/status")
    end

    # Retrieve ERTA approval/rejection response for a batch
    def get_batch_response(batch_id)
      get("/batches/#{batch_id}/response")
    end

    private

    # Generic POST request
    def post(endpoint, data)
      execute_request(:post, endpoint, data)
    end

    # Generic GET request
    def get(endpoint)
      execute_request(:get, endpoint)
    end

    # Execute HTTP request with error handling
    def execute_request(method, endpoint, data = nil)
      url = "#{BASE_URL}/api/#{API_VERSION}#{endpoint}"
      headers = build_headers

      logger.info "[MeklitApiClient] #{method.upcase} #{url}"

      response = case method
      when :post
                   HTTParty.post(url, headers: headers, body: data.to_json, timeout: 30)
      when :get
                   HTTParty.get(url, headers: headers, timeout: 30)
      end

      parse_response(response)
    rescue HTTParty::Error => e
      logger.error "[MeklitApiClient] HTTP error: #{e.message}"
      { success: false, error: "HTTP error: #{e.message}" }
    rescue StandardError => e
      logger.error "[MeklitApiClient] Unexpected error: #{e.message}"
      { success: false, error: e.message }
    end

    # Build request headers with authentication
    def build_headers
      headers = {
        "Content-Type" => "application/json",
        "Accept" => "application/json"
      }
      headers["Authorization"] = "Bearer #{API_KEY}" if API_KEY.present?
      headers
    end

    # Parse HTTP response and return standardized format
    def parse_response(response)
      case response.code
      when 200..299
        { success: true, data: response.parsed_response, status: response.code }
      when 400
        { success: false, error: "Bad request", details: response.parsed_response, status: response.code }
      when 401
        { success: false, error: "Unauthorized - Invalid API key", status: response.code }
      when 403
        { success: false, error: "Forbidden - Insufficient permissions", status: response.code }
      when 404
        { success: false, error: "Resource not found", status: response.code }
      when 422
        { success: false, error: "Validation error", details: response.parsed_response, status: response.code }
      when 429
        { success: false, error: "Rate limit exceeded", status: response.code }
      when 500..599
        { success: false, error: "Server error", status: response.code }
      else
        { success: false, error: "Unknown error (#{response.code})", status: response.code }
      end
    end
  end
end
