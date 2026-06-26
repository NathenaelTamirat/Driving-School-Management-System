# frozen_string_literal: true

# Groups students for bulk ERTA submission. Lifecycle: pending → submitted →
# approved (triggers graduation) or rejected (student stays in training).
class Batch < ApplicationRecord
  validates :name, presence: true, uniqueness: true
  validates :status, inclusion: { in: %w[pending submitted approved rejected] }

  has_many :students, dependent: :destroy

  # Status helper methods
  def pending?
    status == "pending"
  end

  def submitted?
    status == "submitted"
  end

  def approved?
    status == "approved"
  end

  def rejected?
    status == "rejected"
  end
end
