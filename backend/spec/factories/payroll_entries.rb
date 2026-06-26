# frozen_string_literal: true

FactoryBot.define do
  factory :payroll_entry do
    user
    base_pay { 5000.00 }
    active_student_loads { 10 }
    active_training_days { 22 }
    total_pay { 5000.00 }
    period_start { Date.today.beginning_of_month }
    period_end { Date.today.end_of_month }
    status { "draft" }
  end
end
