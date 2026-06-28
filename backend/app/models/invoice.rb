# frozen_string_literal: true

class Invoice < ApplicationRecord
  belongs_to :student

  MILESTONE_TYPES = {
    registration_and_theory: "Registration and Theory Fee",
    practical_fee_release: "Practical Fee Release",
    government_penalty: "Government Penalty"
  }.freeze

  MILESTONE_MAP = {
    milestone_1: MILESTONE_TYPES[:registration_and_theory],
    milestone_2: MILESTONE_TYPES[:practical_fee_release],
    penalty: MILESTONE_TYPES[:government_penalty]
  }.freeze

  STATUSES = %w[pending paid cancelled overdue].freeze

  validates :amount, presence: true, numericality: { greater_than: 0 }
  validates :milestone_type, presence: true, inclusion: { in: MILESTONE_TYPES.values }
  validates :status, presence: true, inclusion: { in: STATUSES }

  before_create :generate_invoice_number

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

  def milestone_invoice?
    milestone_type == MILESTONE_TYPES[:registration_and_theory] ||
      milestone_type == MILESTONE_TYPES[:practical_fee_release]
  end

  def milestone_key
    MILESTONE_MAP.key(milestone_type)
  end

  private

  def generate_invoice_number
    self.invoice_number ||= "INV-#{Time.current.strftime('%Y%m%d')}-#{SecureRandom.hex(4).upcase}"
  end
end
