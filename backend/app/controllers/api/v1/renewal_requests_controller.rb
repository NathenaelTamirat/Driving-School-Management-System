# frozen_string_literal: true

module Api
  module V1
    class RenewalRequestsController < BaseController
      before_action :set_renewal_request, only: [:show, :submit, :complete, :reject]

      def index
        authorize RenewalRequest
        renewal_requests = policy_scope(RenewalRequest)

        if params[:status].present?
          renewal_requests = renewal_requests.where(status: params[:status])
        end

        page = params[:page] || 1
        per_page = params[:per_page] || 20
        renewal_requests = renewal_requests.page(page).per(per_page)

        render json: {
          success: true,
          data: renewal_requests.map { |rr| renewal_request_json(rr) },
          meta: pagination_meta(renewal_requests)
        }, status: :ok
      end

      def show
        authorize @renewal_request
        render json: {
          success: true,
          data: renewal_request_json(@renewal_request)
        }, status: :ok
      end

      def create
        authorize RenewalRequest

        request = RenewalRequest.new(renewal_request_params)

        if request.save
          render json: {
            success: true,
            data: renewal_request_json(request),
            message: "Renewal request created"
          }, status: :created
        else
          render json: {
            success: false,
            errors: request.errors.full_messages
          }, status: :unprocessable_entity
        end
      end

      def submit
        authorize @renewal_request
        @renewal_request.submit!

        render json: {
          success: true,
          data: renewal_request_json(@renewal_request),
          message: "Renewal request submitted"
        }, status: :ok
      rescue ActiveRecord::RecordInvalid => e
        render json: {
          success: false,
          errors: e.record.errors.full_messages
        }, status: :unprocessable_entity
      end

      def complete
        authorize @renewal_request
        @renewal_request.complete!

        render json: {
          success: true,
          data: renewal_request_json(@renewal_request),
          message: "Renewal request completed"
        }, status: :ok
      rescue ActiveRecord::RecordInvalid => e
        render json: {
          success: false,
          errors: e.record.errors.full_messages
        }, status: :unprocessable_entity
      end

      def reject
        authorize @renewal_request
        @renewal_request.reject!

        render json: {
          success: true,
          data: renewal_request_json(@renewal_request),
          message: "Renewal request rejected"
        }, status: :ok
      rescue ActiveRecord::RecordInvalid => e
        render json: {
          success: false,
          errors: e.record.errors.full_messages
        }, status: :unprocessable_entity
      end

      private

      def set_renewal_request
        @renewal_request = RenewalRequest.find(params[:id])
      rescue ActiveRecord::RecordNotFound
        render json: {
          success: false,
          errors: ["Renewal request not found"]
        }, status: :not_found
      end

      def renewal_request_params
        params.require(:renewal_request).permit(
          :full_name, :phone_number, :email, :prior_license_number,
          :blood_type, :eye_acuity_test, :medical_data_updated,
          :registered_kifle_ketema
        )
      end

      def renewal_request_json(request)
        {
          id: request.id,
          full_name: request.full_name,
          phone_number: request.phone_number,
          email: request.email,
          prior_license_number: request.prior_license_number,
          blood_type: request.blood_type,
          eye_acuity_test: request.eye_acuity_test,
          medical_data_updated: request.medical_data_updated,
          medical_data_complete: request.medical_data_complete?,
          registered_kifle_ketema: request.registered_kifle_ketema,
          status: request.status,
          created_at: request.created_at,
          updated_at: request.updated_at
        }
      end

      def pagination_meta(collection)
        {
          current_page: collection.current_page,
          total_pages: collection.total_pages,
          total_count: collection.total_count,
          per_page: collection.limit_value
        }
      end
    end
  end
end
