FactoryBot.define do
  factory :student do
    batch
    status { "registered" }
    student_id { "STU#{Faker::Number.unique.number(digits: 6)}" }
    document_id { "DOC#{Faker::Number.unique.number(digits: 6)}" }
    identification_document { %w[National_ID Kebele_ID Passport Birth_Certificate].sample }
    first_name { Faker::Name.first_name }
    middle_name { Faker::Name.middle_name }
    last_name { Faker::Name.last_name }
    date_of_birth { Faker::Date.birthday(min_age: 18, max_age: 65) }
    blood_type { %w[A+ A- B+ B- AB+ AB- O+ O-].sample }
    address { Faker::Address.street_address }
    house_number { Faker::Address.building_number }
    kebele { Faker::Address.community }
    woreda { Faker::Address.community }
    subcity { Faker::Address.community }
    city { Faker::Address.city }
    verified { false }
    verified_at { nil }
    theory_started_at { nil }
    practical_started_at { nil }
    theory_days_completed { 0 }
    practical_days_completed { 0 }
    last_attendance_date { nil }
    mock_test_score { 0 }
  end
end
