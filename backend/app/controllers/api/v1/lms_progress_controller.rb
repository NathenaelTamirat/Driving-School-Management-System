# frozen_string_literal: true

module Api
  module V1
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
