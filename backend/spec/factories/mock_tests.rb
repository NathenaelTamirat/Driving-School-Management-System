FactoryBot.define do
  factory :mock_test do
    association :student
    score     { 50 }
    test_date { Date.today }
    result    { "pending" }

    trait :passed do
      score { 50 }
    end

    trait :remedial do
      score { 30 }
    end
  end
end
