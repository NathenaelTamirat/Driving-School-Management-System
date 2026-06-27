# frozen_string_literal: true

class LicenseUpgrade < ApplicationRecord
  belongs_to :student

  STATUSES = %w[pending approved rejected].freeze

  validates :prior_license_key, presence: true
  validates :license_origin, presence: true
  validates :license_issue_date, presence: true
  validates :target_category, presence: true
  validates :status, presence: true, inclusion: { in: STATUSES }

  scope :pending, -> { where(status: "pending") }
  scope :approved, -> { where(status: "approved") }
  scope :rejected, -> { where(status: "rejected") }

  def license_age_years
    return nil unless license_issue_date
    ((Time.current - license_issue_date.to_time) / 1.year).floor
  end

  def valid_license_age?
    return false unless license_issue_date
    license_age_years >= 3
  end

  def issued_in_addis_ababa?
    license_origin&.downcase == "addis ababa"
  end

  def eligible_for_upgrade?
    issued_in_addis_ababa? && valid_license_age?
  end

  def approve!
    update!(status: "approved")
  end

  def reject!(reason: nil)
    update!(status: "rejected", rejection_reason: reason)
  end
end
