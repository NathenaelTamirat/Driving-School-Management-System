FactoryBot.define do
  factory :exam_booking do
    student
    exam_type { %w[theory practical].sample }
    scheduled_date { Faker::Time.forward(days: 30, period: :morning) }
    venue { Faker::Address.community }
    status { 'scheduled' }
    score { nil }
    notes { nil }
    completed_at { nil }
  end
end
