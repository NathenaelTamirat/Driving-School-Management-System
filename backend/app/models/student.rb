class Student < ApplicationRecord
  include AASM

  belongs_to :batch
  has_many :exam_bookings,   dependent: :destroy
  has_many :attendance_logs, dependent: :destroy
  has_many :mock_tests,      dependent: :destroy
  has_many :invoices,         dependent: :destroy
  has_many :license_upgrades, dependent: :destroy
  has_one  :graduation_record, dependent: :destroy

  validates :status, presence: true
  validates :student_id, presence: true, uniqueness: true
  validates :document_id, presence: true, uniqueness: true
  validates :first_name, presence: true, length: { maximum: 50 }
  validates :middle_name, presence: true, length: { maximum: 50 }
  validates :last_name, presence: true, length: { maximum: 50 }
  validates :date_of_birth, presence: true
  validates :blood_type, presence: true, inclusion: { in: %w[A+ A- B+ B- AB+ AB- O+ O-] }
  validates :address, presence: true, length: { maximum: 200 }
  validates :house_number, presence: true, length: { maximum: 20 }
  validates :woreda, presence: true, length: { maximum: 50 }
  validates :city, presence: true, length: { maximum: 50 }
  validates :kebele, length: { maximum: 50 }, allow_blank: true
  validates :subcity, length: { maximum: 50 }, allow_blank: true
  validates :theory_days_completed, numericality: { greater_than_or_equal_to: 0 }
  validates :practical_days_completed, numericality: { greater_than_or_equal_to: 0 }
  validates :mock_test_score, numericality: { greater_than_or_equal_to: 0, less_than_or_equal_to: 100 }

  # Helper method for exam eligibility check
  def exam_eligible?
    status == "exam_eligible"
  end

  # Check if student is currently under penalty
  def under_penalty_active?
    under_penalty? && penalty_end_date.present? && penalty_end_date >= Time.current
  end

  aasm column: :status do
    state :registered, initial: true
    state :theory_in_progress
    state :practical_in_progress
    state :exam_eligible
    state :graduated

    event :start_theory do
      transitions from: :registered, to: :theory_in_progress
    end

    event :start_practical do
      # Guard: theory_days >= 35 AND mock_test_score > 37
      transitions from: :theory_in_progress, to: :practical_in_progress,
                  guard: :can_start_practical?

      after do
        # Placeholder for Finance::MilestoneTracker integration
        # Rails.logger.info "Triggering Milestone 2 invoice for Student #{id}"
      end
    end

    event :make_eligible do
      # Guard: practical_days >= 52
      transitions from: :practical_in_progress, to: :exam_eligible,
                  guard: :can_make_eligible?
    end

    event :graduate do
      transitions from: :exam_eligible, to: :graduated
    end
  end

  private

  def can_start_practical?
    theory_days_completed >= 35 && mock_test_score > 37
  end

  def can_make_eligible?
    practical_days_completed >= 52
  end
end
