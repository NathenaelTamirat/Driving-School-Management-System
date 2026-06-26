# frozen_string_literal: true

module Api
  module V1
    # Public controller returning hardcoded Ethiopian license categories.
    # Each category (B, C, D, A) includes ETB pricing, age requirements,
    # and mandated training hours. Matches the ERTA classification system.
    class LicenseCategoriesController < ApplicationController
      # GET /api/v1/license_categories
      def index
        # Hardcoded license categories and pricing
        @categories = [
          {
            id: "B",
            name: "Class B - Light Vehicles",
            description: "Passenger cars, light trucks, and vans",
            price: 5000,
            currency: "ETB",
            age_requirement: 18,
            theory_hours: 35,
            practical_hours: 52
          },
          {
            id: "C",
            name: "Class C - Medium Vehicles",
            description: "Medium trucks and buses",
            price: 7000,
            currency: "ETB",
            age_requirement: 21,
            theory_hours: 35,
            practical_hours: 52
          },
          {
            id: "D",
            name: "Class D - Heavy Vehicles",
            description: "Heavy trucks and construction vehicles",
            price: 10000,
            currency: "ETB",
            age_requirement: 25,
            theory_hours: 35,
            practical_hours: 52
          },
          {
            id: "A",
            name: "Class A - Motorcycles",
            description: "Motorcycles and scooters",
            price: 3000,
            currency: "ETB",
            age_requirement: 16,
            theory_hours: 20,
            practical_hours: 30
          }
        ]

        render json: @categories
      end
    end
  end
end
