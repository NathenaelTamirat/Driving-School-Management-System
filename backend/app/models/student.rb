class Student < ApplicationRecord
  include AASM

  belongs_to :batch
  belongs_to :course, optional: true
  belongs_to :instructor, class_name: "User", optional: true
  has_many :exam_bookings,   dependent: :destroy
  has_many :attendance_logs, dependent: :destroy
  has_many :mock_tests,      dependent: :destroy
  has_many :invoices,         dependent: :destroy
  has_many :license_upgrades, dependent: :destroy
  has_one  :graduation_record, dependent: :destroy

  has_one_attached :profile_photo
  has_one_attached :yellow_card
  has_one_attached :grade_8
  has_one_attached :grade_10
  has_one_attached :grade_12
  has_one_attached :medical

  validates :status, presence: true
  validates :student_id, presence: true, uniqueness: true
  validates :document_id, presence: true, uniqueness: true
  validates :identification_document, inclusion: { in: %w[National_ID Kebele_ID Passport Birth_Certificate] }, allow_blank: true
  validates :education_level, inclusion: { in: %w[Grade_4_Certificate Grade_10_Certificate] }, allow_blank: true
  validates :n_number, uniqueness: true, allow_blank: true
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

  def exam_eligible?
    status == "exam_eligible"
  end

  def under_penalty_active?
    under_penalty? && penalty_end_date.present? && penalty_end_date >= Time.current
  end

  def is_upgrade?
    license_upgrades.where(status: %w[pending approved]).exists?
  end

  aasm column: :status do
    state :registered, initial: true
    state :queued_for_meklit
    state :sent_to_meklit
    state :approved
    state :rejected
    state :pending_original_verification
    state :theory_in_progress
    state :theory_remedial
    state :practical_in_progress
    state :failed_practical_remedial
    state :exam_eligible
    state :graduated

    event :queue_for_meklit do
      transitions from: :registered, to: :queued_for_meklit
    end

    event :send_to_meklit do
      transitions from: :queued_for_meklit, to: :sent_to_meklit
    end

    event :approve_by_meklit do
      transitions from: :sent_to_meklit, to: :approved
    end

    event :reject_by_meklit do
      transitions from: :sent_to_meklit, to: :rejected
    end

    event :flag_pending_verification do
      transitions from: :rejected, to: :pending_original_verification
    end

    event :re_verify do
      transitions from: :pending_original_verification, to: :queued_for_meklit
    end

    event :start_theory do
      transitions from: [:approved, :registered], to: :theory_in_progress
    end

    event :fail_mock_test do
      transitions from: :theory_in_progress, to: :theory_remedial
    end

    event :retake_mock_test do
      transitions from: :theory_remedial, to: :theory_in_progress
    end

    event :start_practical do
      transitions from: :theory_in_progress, to: :practical_in_progress,
                  guard: :can_start_practical?
    end

    event :fail_practical_exam do
      transitions from: :practical_in_progress, to: :failed_practical_remedial
    end

    event :complete_remedial do
      transitions from: :failed_practical_remedial, to: :practical_in_progress
    end

    event :make_eligible do
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
