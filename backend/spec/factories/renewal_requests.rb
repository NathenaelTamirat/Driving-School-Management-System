# frozen_string_literal: true

FactoryBot.define do
  factory :renewal_request do
    full_name { Faker::Name.name }
    phone_number { "+2519#{Faker::Number.unique.number(digits: 8)}" }
    email { Faker::Internet.email }
    prior_license_number { "AA-#{Faker::Number.unique.number(digits: 8)}" }
    blood_type { "O+" }
    eye_acuity_test { "20/20" }
    medical_data_updated { true }
    registered_kifle_ketema { "Bole" }
    status { "pending" }
  end
end
