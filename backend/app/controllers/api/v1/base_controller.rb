# frozen_string_literal: true

module Api
  module V1
    # Authenticated base controller.
    # Endpoints inheriting from this class require a valid JWT (authenticate_user!).
    # Provides standardized render_success / render_error envelopes for all
    # authenticated endpoints and catches RecordNotFound / ParameterMissing.
    # Public endpoints (students, batches, exam_bookings) inherit directly from
    # ApplicationController instead.
    class BaseController < ApplicationController
      include Devise::Controllers::Helpers

      before_action :authenticate_user!

      rescue_from ActiveRecord::RecordNotFound, with: :not_found_error
      rescue_from ActionController::ParameterMissing, with: :parameter_missing_error

      private

      # Standardized JSON envelopes.
      def render_success(data, status: :ok, message: nil)
        body = { success: true, data: data }
        body[:message] = message if message.present?
        render json: body, status: status
      end

      def render_error(message, status: :unprocessable_entity, errors: nil, code: nil)
        error = { message: message }
        error[:code] = code if code.present?
        error[:details] = errors if errors.present?
        render json: { success: false, error: error }, status: status
      end

      def not_found_error(exception)
        render_error("Resource not found", status: :not_found, code: "NOT_FOUND",
                                           errors: { resource: exception.message })
      end

      def parameter_missing_error(exception)
        render_error("Missing required parameter: #{exception.param}",
                     status: :bad_request, code: "PARAMETER_MISSING")
      end
    end
  end
end
