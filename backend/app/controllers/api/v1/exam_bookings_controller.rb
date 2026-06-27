# frozen_string_literal: true

module Api
  module V1
    class ExamBookingsController < BaseController
      before_action :set_student
      before_action :set_exam_booking, only: %i[show update cancel record_result]
      before_action :validate_eligibility, only: %i[create]

      # GET /api/v1/students/:student_id/exam_bookings
      def index
        authorize ExamBooking
        @exam_bookings = @student.exam_bookings.order(scheduled_date: :asc)
        render_success(@exam_bookings)
      end

      # GET /api/v1/students/:student_id/exam_bookings/:id
      def show
        authorize @exam_booking
        render_success(@exam_booking)
      end

      # POST /api/v1/students/:student_id/exam_bookings
      def create
        authorize ExamBooking
        @exam_booking = @student.exam_bookings.new(exam_booking_params)

        if @exam_booking.save
          # Send exam booking notification email
          send_exam_booking_email
          render_success(@exam_booking, status: :created)
        else
          render_error("Failed to create exam booking", errors: @exam_booking.errors.full_messages)
        end
      end

      # PATCH/PUT /api/v1/students/:student_id/exam_bookings/:id
      def update
        authorize @exam_booking
        if @exam_booking.update(exam_booking_params)
          render_success(@exam_booking)
        else
          render_error("Failed to update exam booking", errors: @exam_booking.errors.full_messages)
        end
      end

      # POST /api/v1/students/:student_id/exam_bookings/:id/cancel
      def cancel
        authorize @exam_booking
        if @exam_booking.cancel!
          render_success(@exam_booking)
        else
          render_error("Failed to cancel exam booking", errors: @exam_booking.errors.full_messages)
        end
      end

      # POST /api/v1/students/:student_id/exam_bookings/:id/record_result
      def record_result
        authorize @exam_booking
        result_params = params.require(:exam_booking).permit(:score, :notes)

        ActiveRecord::Base.transaction do
          @exam_booking.complete!(result_params[:score], result_params[:notes])

          if @exam_booking.failed?
            penalty_engine = Penalty::PenaltyEngine.new(@student, @exam_booking)
            raise ActiveRecord::Rollback unless penalty_engine.apply_failure_penalty
          end
        end

        # Send exam result notification email (outside the transaction — email delivery must not roll back)
        send_exam_result_email

        render_success(@exam_booking)
      rescue ActiveRecord::RecordNotFound
        render_error("Exam booking not found", status: :not_found, code: "NOT_FOUND")
      rescue ActiveRecord::RecordInvalid => e
        render_error("Failed to record exam result", errors: e.record.errors.full_messages)
      end

      private

      def set_student
        @student = Student.find(params[:student_id])
      rescue ActiveRecord::RecordNotFound
        render_error("Student not found", status: :not_found, code: "NOT_FOUND")
      end

      def set_exam_booking
        @exam_booking = @student.exam_bookings.find(params[:id])
      rescue ActiveRecord::RecordNotFound
        render_error("Exam booking not found", status: :not_found, code: "NOT_FOUND")
      end

      def validate_eligibility
        validator = ERTA::EligibilityValidator.new(@student)
        unless validator.call
          render_error("Student not eligible for exam", status: :forbidden, errors: validator.errors)
        end
      end

      def send_exam_booking_email
        student_email = @student.email.presence or raise "Student #{@student.student_id} has no email"
        MeklitMailer.exam_booking(@exam_booking, student_email).deliver_later
      rescue StandardError => e
        Rails.logger.error "[ExamBookingsController] Failed to send booking email: #{e.message}"
        # Don't fail the request if email fails
      end

      def send_exam_result_email
        student_email = @student.email.presence or raise "Student #{@student.student_id} has no email"
        MeklitMailer.exam_result(@exam_booking, student_email).deliver_later
      rescue StandardError => e
        Rails.logger.error "[ExamBookingsController] Failed to send result email: #{e.message}"
        # Don't fail the request if email fails
      end
    end
  end
end
