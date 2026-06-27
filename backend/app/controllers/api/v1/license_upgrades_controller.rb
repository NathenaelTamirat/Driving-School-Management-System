# frozen_string_literal: true

module Api
  module V1
    class LicenseUpgradesController < BaseController
      before_action :set_license_upgrade, only: [:show, :approve, :reject]

      def index
        authorize LicenseUpgrade
        license_upgrades = policy_scope(LicenseUpgrade)

        if params[:status].present?
          license_upgrades = license_upgrades.where(status: params[:status])
        end

        page = params[:page] || 1
        per_page = params[:per_page] || 20
        license_upgrades = license_upgrades.page(page).per(per_page)

        render json: {
          success: true,
          data: license_upgrades.map { |lu| license_upgrade_json(lu) },
          meta: pagination_meta(license_upgrades)
        }, status: :ok
      end

      def show
        authorize @license_upgrade
        render json: {
          success: true,
          data: license_upgrade_json(@license_upgrade)
        }, status: :ok
      end

      def create
        authorize LicenseUpgrade

        upgrade = LicenseUpgrade.new(license_upgrade_params)

        if upgrade.save
          render json: {
            success: true,
            data: license_upgrade_json(upgrade),
            message: "License upgrade request created"
          }, status: :created
        else
          render json: {
            success: false,
            errors: upgrade.errors.full_messages
          }, status: :unprocessable_entity
        end
      end

      def approve
        authorize @license_upgrade
        @license_upgrade.approve!

        render json: {
          success: true,
          data: license_upgrade_json(@license_upgrade),
          message: "License upgrade approved"
        }, status: :ok
      rescue ActiveRecord::RecordInvalid => e
        render json: {
          success: false,
          errors: e.record.errors.full_messages
        }, status: :unprocessable_entity
      end

      def reject
        authorize @license_upgrade
        @license_upgrade.reject!(reason: params[:reason])

        render json: {
          success: true,
          data: license_upgrade_json(@license_upgrade),
          message: "License upgrade rejected"
        }, status: :ok
      rescue ActiveRecord::RecordInvalid => e
        render json: {
          success: false,
          errors: e.record.errors.full_messages
        }, status: :unprocessable_entity
      end

      private

      def set_license_upgrade
        @license_upgrade = LicenseUpgrade.find(params[:id])
      rescue ActiveRecord::RecordNotFound
        render json: {
          success: false,
          errors: ["License upgrade not found"]
        }, status: :not_found
      end

      def license_upgrade_params
        params.require(:license_upgrade).permit(
          :student_id, :prior_license_key, :license_origin,
          :license_issue_date, :target_category, :timir_compound_flag
        )
      end

      def license_upgrade_json(upgrade)
        {
          id: upgrade.id,
          student_id: upgrade.student_id,
          prior_license_key: upgrade.prior_license_key,
          license_origin: upgrade.license_origin,
          license_issue_date: upgrade.license_issue_date,
          target_category: upgrade.target_category,
          timir_compound_flag: upgrade.timir_compound_flag,
          status: upgrade.status,
          rejection_reason: upgrade.rejection_reason,
          license_age_years: upgrade.license_age_years,
          eligible_for_upgrade: upgrade.eligible_for_upgrade?,
          created_at: upgrade.created_at,
          updated_at: upgrade.updated_at
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
