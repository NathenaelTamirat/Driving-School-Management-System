# frozen_string_literal: true

class Course < ApplicationRecord
  # Validations
  validates :course_name, presence: true
  validates :license_category, presence: true, inclusion: { in: %w[A B C D E] }
  validates :theory_days_required, presence: true, numericality: { greater_than: 0 }
  validates :practical_days_required, presence: true, numericality: { greater_than: 0 }
  validates :min_education_level, presence: true
  validates :min_age, presence: true, numericality: { greater_than_or_equal_to: 18 }
  validates :standard_fee, presence: true, numericality: { greater_than: 0 }

  # Associations
  has_many :students, dependent: :restrict_with_error

  # Scopes
  scope :active, -> { where(is_active: true) }
  scope :by_category, ->(category) { where(license_category: category) }

  # Instance methods
  def fee_for_tier(tier)
    case tier.to_s
    when 'standard'
      standard_fee
    when 'premium'
      premium_fee || standard_fee
    when 'fast_track'
      fast_track_fee || standard_fee
    else
      standard_fee
    end
  end

  def upgrade_fee(tier)
    base_fee = fee_for_tier(tier)
    discount = upgrade_discount_percentage || 30
    base_fee * (1 - discount / 100.0)
  end
end
