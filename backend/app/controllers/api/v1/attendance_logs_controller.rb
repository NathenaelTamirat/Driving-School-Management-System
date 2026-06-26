# frozen_string_literal: true

module Api
  module V1
    # Authenticated controller for daily attendance logging.
    # Supports filtering by phase (theory/practical), date, and presence status.
    # Delegates recording to Lms::AttendanceRecorder, which also increments
    # the student's day counters and drives the AASM state machine transitions.
    class AttendanceLogsController < BaseController
      before_action :set_student

      def index
        logs = @student.attendance_logs
        logs = logs.for_phase(params[:phase])             if params[:phase].present?
        logs = logs.on_date(Date.parse(params[:date]))    if params[:date].present?
        logs = logs.where(present: params[:present])      if params[:present].present?

        render_success(logs.order(attendance_date: :desc))
      end

      def create
        recorder = Lms::AttendanceRecorder.new(@student, attendance_log_params)

        if recorder.call
          render_success(@student.attendance_logs.order(created_at: :desc).first,
                         status: :created,
                         message: "Attendance logged successfully")
        else
          render_error("Failed to log attendance", errors: recorder.errors)
        end
      end

      private

      def set_student
        @student = Student.find(params[:student_id])
      rescue ActiveRecord::RecordNotFound
        render_error("Student not found", status: :not_found, code: "NOT_FOUND")
      end

      def attendance_log_params
        params.require(:attendance_log).permit(
          :phase, :attendance_date, :present,
          :instructor_name, :digital_signature, :notes
        )
      end
    end
  end
end
