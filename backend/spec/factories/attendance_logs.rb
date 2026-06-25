FactoryBot.define do
  factory :attendance_log do
    association :student
    phase             { "theory" }
    sequence(:attendance_date) { |n| Date.today - n }
    present           { true }
    locked            { false }
    instructor_name   { Faker::Name.name }
    digital_signature { "SIG-#{Faker::Alphanumeric.alphanumeric(number: 8).upcase}" }
    notes             { nil }

    trait :practical do
      phase { "practical" }
    end

    trait :absent do
      present { false }
    end

    trait :manually_locked do
      locked { true }
    end
  end
end
