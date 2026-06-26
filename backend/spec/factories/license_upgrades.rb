# frozen_string_literal: true

FactoryBot.define do
  factory :license_upgrade do
    student
    prior_license_key { "AA-#{Faker::Number.unique.number(digits: 8)}" }
    license_origin { "Addis Ababa" }
    license_issue_date { Faker::Date.between(from: 5.years.ago, to: 3.years.ago) }
    target_category { "Public 2" }
    timir_compound_flag { false }
    status { "pending" }
  end
end
