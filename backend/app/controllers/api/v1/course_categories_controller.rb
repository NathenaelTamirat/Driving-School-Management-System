# frozen_string_literal: true

module Api
  module V1
    # Authenticated controller returning course categories (enrollment packages)
    # loaded from config/course_categories.yml. Prices and requirements can be
    # updated without code changes. This is the single source of truth — the
    # frontend should fetch from this endpoint rather than hardcoding prices.
    class CourseCategoriesController < BaseController
      # GET /api/v1/course_categories
      def index
        authorize :course_category
        render_success(categories_config["categories"])
      end

      private

      def categories_config
        @categories_config ||= YAML.load_file(
          Rails.root.join("config", "course_categories.yml")
        )
      end
    end
  end
end
