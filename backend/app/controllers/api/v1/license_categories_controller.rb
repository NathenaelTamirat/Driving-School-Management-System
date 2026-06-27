# frozen_string_literal: true

module Api
  module V1
    # Authenticated controller returning Ethiopian license categories loaded
    # from config/license_categories.yml. Prices and requirements can be
    # updated without code changes.
    class LicenseCategoriesController < BaseController
      # GET /api/v1/license_categories
      def index
        authorize :license_category
        render_success(categories_config["categories"])
      end

      private

      def categories_config
        @categories_config ||= YAML.load_file(
          Rails.root.join("config", "license_categories.yml")
        )
      end
    end
  end
end
