FactoryBot.define do
  factory :user do
    sequence(:email) { |n| "user#{n}@example.com" }
    password { "Password123!" }
    full_name { Faker::Name.name }
    role { "student" }

    trait :admin do
      role { "admin" }
    end

    trait :clerk do
      role { "clerk" }
    end

    trait :instructor do
      role { "instructor" }
      instructor_license_number { "LIC-#{Faker::Number.unique.number(digits: 5)}" }
      instructor_category { "B" }
    end
  end
end
