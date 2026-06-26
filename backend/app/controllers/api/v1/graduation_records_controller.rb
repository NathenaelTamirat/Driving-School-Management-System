# frozen_string_literal: true

module Api
  module V1
    class GraduationRecordsController < BaseController
      before_action :set_student

      def show
        record = @student.graduation_record
        if record
          render_success(record)
        else
          render_error("No graduation record found for this student", status: :not_found, code: "NOT_FOUND")
        end
      end

      def create
        processor = Graduation::Processor.new(@student)

        if processor.call
          render_success(@student.graduation_record, status: :created,
                         message: "Student graduated successfully")
        else
          render_error("Graduation failed", errors: processor.errors)
        end
      end

      private

      def set_student
        @student = Student.find(params[:student_id])
      rescue ActiveRecord::RecordNotFound
        render_error("Student not found", status: :not_found, code: "NOT_FOUND")
      end
    end
  end
end
