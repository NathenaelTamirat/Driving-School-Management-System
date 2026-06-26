# frozen_string_literal: true

module Api
  module V1
    # Single-endpoint controller returning a student's training progress.
    # Delegates to Lms::ProgressCalculator which computes theory/practical
    # completion percentages, mock test status, and the next milestone step.
    class LmsProgressController < BaseController
      def show
        student = Student.find(params[:student_id])
        progress = Lms::ProgressCalculator.new(student).call
        render_success(progress)
      rescue ActiveRecord::RecordNotFound
        render_error("Student not found", status: :not_found, code: "NOT_FOUND")
      end
    end
  end
end
