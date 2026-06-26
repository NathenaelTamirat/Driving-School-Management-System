# frozen_string_literal: true

module Lms
  # Computes a student's training progress summary for the dashboard.
  # Returns theory/practical completion percentages, mock test status,
  # and a human-readable next-milestone hint. Used by LmsProgressController.
  class ProgressCalculator
    THEORY_REQUIRED    = 35
    PRACTICAL_REQUIRED = 52
    MOCK_PASS_SCORE    = 37

    attr_reader :student

    def initialize(student)
      @student = student
    end

    def call
      {
        status:            student.status,
        theory:            theory_progress,
        practical:         practical_progress,
        mock_test:         mock_test_progress,
        next_milestone:    next_milestone,
        exam_eligible:     student.exam_eligible?
      }
    end

    private

    def theory_progress
      {
        days_completed: student.theory_days_completed,
        days_required:  THEORY_REQUIRED,
        percentage:     percentage(student.theory_days_completed, THEORY_REQUIRED),
        complete:       student.theory_days_completed >= THEORY_REQUIRED
      }
    end

    def practical_progress
      {
        days_completed: student.practical_days_completed,
        days_required:  PRACTICAL_REQUIRED,
        percentage:     percentage(student.practical_days_completed, PRACTICAL_REQUIRED),
        complete:       student.practical_days_completed >= PRACTICAL_REQUIRED
      }
    end

    def mock_test_progress
      {
        score:    student.mock_test_score,
        required: MOCK_PASS_SCORE,
        passed:   student.mock_test_score > MOCK_PASS_SCORE
      }
    end

    def next_milestone
      case student.status
      when "registered"          then "Log first theory attendance to begin training"
      when "theory_in_progress"  then "Complete #{THEORY_REQUIRED} theory days and score > #{MOCK_PASS_SCORE} on mock test"
      when "practical_in_progress" then "Complete #{PRACTICAL_REQUIRED} practical days"
      when "exam_eligible"       then "Book ERTA exam"
      when "graduated"           then "Training complete"
      else "Unknown"
      end
    end

    def percentage(completed, required)
      return 100 if completed >= required

      ((completed.to_f / required) * 100).round(1)
    end
  end
end
