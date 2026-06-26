# frozen_string_literal: true

FactoryBot.define do
  factory :course do
    sequence(:name) { |n| "Driving Course #{n}" }
    sequence(:course_code) { |n| "CRS-#{n.to_s.rjust(4, '0')}" }
    description { "Comprehensive driving instruction covering theory and practical training" }
    standard_price { 8000.00 }
    premium_price { 10000.00 }
    fast_track_price { 13000.00 }
    duration_weeks { 12 }
    theory_hours { 35 }
    practical_hours { 52 }

    trait :standard do
      name { "Standard Driving Course" }
      course_code { "STD-2024" }
      duration_weeks { 12 }
    end

    trait :premium do
      name { "Premium Driving Course" }
      course_code { "PRM-2024" }
      duration_weeks { 10 }
    end

    trait :fast_track do
      name { "Fast Track Driving Course" }
      course_code { "FTK-2024" }
      duration_weeks { 8 }
    end
  end
end
