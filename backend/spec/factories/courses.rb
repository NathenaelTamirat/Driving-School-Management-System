# frozen_string_literal: true

FactoryBot.define do
  factory :course do
    sequence(:course_name) { |n| "Driving Course #{n}" }
    license_category { %w[A B C D E].sample }
    description { "Comprehensive driving instruction covering theory and practical training" }
    standard_fee { 8000.00 }
    premium_fee { 10000.00 }
    fast_track_fee { 13000.00 }
    theory_days_required { 35 }
    practical_days_required { 52 }
    min_education_level { "Grade_10_Certificate" }
    min_age { 18 }
    is_active { true }
    upgrade_discount_percentage { 30 }

    trait :standard do
      course_name { "Standard Driving Course" }
    end

    trait :premium do
      course_name { "Premium Driving Course" }
      premium_fee { 10000.00 }
    end

    trait :fast_track do
      course_name { "Fast Track Driving Course" }
      fast_track_fee { 13000.00 }
    end

    trait :upgrade do
      upgrade_discount_percentage { 30 }
    end
  end
end
