# frozen_string_literal: true

class PayrollEntry < ApplicationRecord
  belongs_to :user

  STATUSES = %w[draft paid cancelled].freeze

  validates :base_pay, presence: true, numericality: { greater_than_or_equal_to: 0 }
  validates :active_student_loads, presence: true, numericality: { greater_than_or_equal_to: 0 }
  validates :active_training_days, presence: true, numericality: { greater_than_or_equal_to: 0 }
  validates :total_pay, presence: true, numericality: { greater_than_or_equal_to: 0 }
  validates :period_start, presence: true
  validates :period_end, presence: true
  validates :status, presence: true, inclusion: { in: STATUSES }

  scope :draft, -> { where(status: "draft") }
  scope :paid, -> { where(status: "paid") }
  scope :for_period, ->(start_date, end_date) { where(period_start: start_date, period_end: end_date) }
  scope :by_user, ->(user_id) { where(user_id: user_id) }

  def draft?
    status == "draft"
  end

  def paid?
    status == "paid"
  end

  def mark_as_paid!
    update!(status: "paid", paid_at: Time.current)
  end

  def cancel!
    update!(status: "cancelled")
  end
end
