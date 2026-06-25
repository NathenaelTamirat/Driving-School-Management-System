# frozen_string_literal: true

class AttendanceLog < ApplicationRecord
  belongs_to :student

  PHASES = %w[theory practical].freeze

  validates :phase,
            presence: true,
            inclusion: { in: PHASES, message: "must be 'theory' or 'practical'" }

  validates :attendance_date, presence: true

  validates :attendance_date,
            uniqueness: {
              scope: %i[student_id phase],
              message: "already has an attendance log for this phase on this date"
            }

  validate :cannot_edit_when_locked, on: :update

  scope :present,   -> { where(present: true) }
  scope :for_phase, ->(phase) { where(phase: phase) }
  scope :on_date,   ->(date)  { where(attendance_date: date) }
  scope :locked,    -> { where(locked: true) }
  scope :unlocked,  -> { where(locked: false) }

  def lockable?
    locked? || (created_at.present? && created_at <= 24.hours.ago)
  end

  private

  def cannot_edit_when_locked
    return unless lockable?

    errors.add(:base, "Attendance log is locked and cannot be edited after 24 hours")
  end
end
