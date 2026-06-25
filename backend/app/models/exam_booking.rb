# frozen_string_literal: true

class ExamBooking < ApplicationRecord
  belongs_to :student

  validates :exam_type, presence: true, inclusion: { in: %w[theory practical] }
  validates :scheduled_date, presence: true
  validates :status, presence: true, inclusion: { in: %w[scheduled completed cancelled no_show] }
  validates :score, numericality: { greater_than_or_equal_to: 0, less_than_or_equal_to: 100 }, allow_nil: true

  validate :scheduled_date_must_be_in_future, on: :create
  validate :score_required_if_completed

  # Passing score threshold (can be configured per exam type)
  PASSING_SCORE = 50

  # Check if exam was passed
  def passed?
    completed? && score.present? && score >= PASSING_SCORE
  end

  # Check if exam was failed
  def failed?
    completed? && score.present? && score < PASSING_SCORE
  end

  scope :scheduled, -> { where(status: "scheduled") }
  scope :completed, -> { where(status: "completed") }
  scope :upcoming, -> { where("scheduled_date >= ?", Time.current) }
  scope :past, -> { where("scheduled_date < ?", Time.current) }

  # Status helper methods
  def scheduled?
    status == "scheduled"
  end

  def completed?
    status == "completed"
  end

  def cancelled?
    status == "cancelled"
  end

  def no_show?
    status == "no_show"
  end

  # Mark exam as completed with score
  def complete!(score, notes = nil)
    update!(status: "completed", score: score, notes: notes, completed_at: Time.current)
  end

  # Cancel the exam booking
  def cancel!
    update!(status: "cancelled")
  end

  # Mark as no-show
  def mark_no_show!
    update!(status: "no_show")
  end

  private

  def scheduled_date_must_be_in_future
    if scheduled_date.present? && scheduled_date < Time.current
      errors.add(:scheduled_date, "must be in the future")
    end
  end

  def score_required_if_completed
    if completed? && score.nil?
      errors.add(:score, "is required when exam is completed")
    end
  end
end
