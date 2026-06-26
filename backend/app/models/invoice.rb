# frozen_string_literal: true

class Invoice < ApplicationRecord
  belongs_to :student

  MILESTONE_TYPES = {
    registration_and_theory: "Registration and Theory Fee",
    practical_fee_release: "Practical Fee Release",
    government_penalty: "Government Penalty"
  }.freeze

  STATUSES = %w[pending paid cancelled overdue].freeze

  validates :amount, presence: true, numericality: { greater_than: 0 }
  validates :milestone_type, presence: true, inclusion: { in: MILESTONE_TYPES.values }
  validates :status, presence: true, inclusion: { in: STATUSES }

  scope :pending, -> { where(status: "pending") }
  scope :paid, -> { where(status: "paid") }
  scope :overdue, -> { where(status: "overdue") }
  scope :by_milestone, ->(type) { where(milestone_type: type) }

  def paid?
    status == "paid"
  end

  def mark_as_paid!
    update!(status: "paid", paid_at: Time.current)
  end

  def overdue?
    status == "overdue"
  end

  def mark_as_overdue!
    update!(status: "overdue")
  end

  def cancel!
    update!(status: "cancelled")
  end
end
