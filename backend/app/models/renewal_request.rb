# frozen_string_literal: true

class RenewalRequest < ApplicationRecord
  STATUSES = %w[pending submitted completed rejected].freeze

  validates :full_name, presence: true, length: { maximum: 100 }
  validates :phone_number, presence: true, length: { maximum: 20 }
  validates :prior_license_number, presence: true
  validates :registered_kifle_ketema, presence: true
  validates :status, presence: true, inclusion: { in: STATUSES }
  validates :blood_type, inclusion: { in: %w[A+ A- B+ B- AB+ AB- O+ O-] }, allow_blank: true

  scope :pending, -> { where(status: "pending") }
  scope :submitted, -> { where(status: "submitted") }
  scope :completed, -> { where(status: "completed") }
  scope :rejected, -> { where(status: "rejected") }

  def medical_data_complete?
    blood_type.present? && eye_acuity_test.present?
  end

  def submit!
    update!(status: "submitted")
  end

  def complete!
    update!(status: "completed")
  end

  def reject!
    update!(status: "rejected")
  end
end
