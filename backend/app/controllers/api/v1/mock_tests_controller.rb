# frozen_string_literal: true

module Api
  module V1
    # Authenticated controller for recording student mock test results.
    # Mock tests determine readiness for the actual ERTA exam: a score > 37
    # grants a "passed" result and unlocks the practical training phase,
    # while ≤ 37 flags the student for remedial training.
    # The score is synced to the student record via an after_save hook on the model.
    class MockTestsController < BaseController
      before_action :set_student

      def index
        render_success(@student.mock_tests.order(test_date: :desc))
      end

      def create
        mock_test = @student.mock_tests.build(mock_test_params)

        if mock_test.save
          render_success(mock_test, status: :created, message: "Mock test recorded successfully")
        else
          render_error("Failed to record mock test", errors: mock_test.errors.full_messages)
        end
      end

      private

      def set_student
        @student = Student.find(params[:student_id])
      rescue ActiveRecord::RecordNotFound
        render_error("Student not found", status: :not_found, code: "NOT_FOUND")
      end

      def mock_test_params
        params.require(:mock_test).permit(:score, :test_date)
      end
    end
  end
end
