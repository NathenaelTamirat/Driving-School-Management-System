# frozen_string_literal: true

FactoryBot.define do
  factory :invoice do
    student
    amount { 26010.00 }
    milestone_type { "Registration and Theory Fee" }
    status { "pending" }
    due_date { Date.today + 30 }
  end
end
