# frozen_string_literal: true

module Api
  module V1
    class ExamBookingsController < ApplicationController
      before_action :set_student
      before_action :set_exam_booking, only: %i[show update cancel]
      before_action :validate_eligibility, only: %i[create]

      # GET /api/v1/students/:student_id/exam_bookings
      def index
        @exam_bookings = @student.exam_bookings.order(scheduled_date: :asc)
        render json: @exam_bookings
      end

      # GET /api/v1/students/:student_id/exam_bookings/:id
      def show
        render json: @exam_booking
      end

      # POST /api/v1/students/:student_id/exam_bookings
      def create
        @exam_booking = @student.exam_bookings.new(exam_booking_params)

        if @exam_booking.save
          # Send exam booking notification email
          send_exam_booking_email
          render json: @exam_booking, status: :created
        else
          render json: { errors: @exam_booking.errors.full_messages }, status: :unprocessable_entity
        end
      end

      # PATCH/PUT /api/v1/students/:student_id/exam_bookings/:id
      def update
        if @exam_booking.update(exam_booking_params)
          render json: @exam_booking
        else
          render json: { errors: @exam_booking.errors.full_messages }, status: :unprocessable_entity
        end
      end

      # POST /api/v1/students/:student_id/exam_bookings/:id/cancel
      def cancel
        if @exam_booking.cancel!
          render json: @exam_booking
        else
          render json: { errors: @exam_booking.errors.full_messages }, status: :unprocessable_entity
        end
      end

      # POST /api/v1/students/:student_id/exam_bookings/:id/record_result
      def record_result
        result_params = params.require(:exam_booking).permit(:score, :notes)

        if @exam_booking.complete!(result_params[:score], result_params[:notes])
          # Apply penalty if exam was failed
          if @exam_booking.failed?
            penalty_engine = Penalty::PenaltyEngine.new(@student, @exam_booking)
            penalty_engine.apply_failure_penalty
          end

          # Send exam result notification email
          send_exam_result_email

          render json: @exam_booking
        else
          render json: { errors: @exam_booking.errors.full_messages }, status: :unprocessable_entity
        end
      end

      private

      def set_student
        @student = Student.find(params[:student_id])
      rescue ActiveRecord::RecordNotFound
        render json: { error: "Student not found" }, status: :not_found
      end

      def set_exam_booking
        @exam_booking = @student.exam_bookings.find(params[:id])
      rescue ActiveRecord::RecordNotFound
        render json: { error: "Exam booking not found" }, status: :not_found
      end

      def exam_booking_params
        params.require(:exam_booking).permit(:exam_type, :scheduled_date, :venue, :notes)
      end

      def validate_eligibility
        validator = ERTA::EligibilityValidator.new(@student)
        unless validator.call
          render json: { errors: validator.errors }, status: :forbidden
        end
      end

      def send_exam_booking_email
        # TODO: Add email field to student model and use @student.email
        # For now, using a placeholder email
        student_email = "#{@student.student_id}@example.com"
        MeklitMailer.exam_booking(@exam_booking, student_email).deliver_later
      rescue StandardError => e
        Rails.logger.error "[ExamBookingsController] Failed to send booking email: #{e.message}"
        # Don't fail the request if email fails
      end

      def send_exam_result_email
        # TODO: Add email field to student model and use @student.email
        # For now, using a placeholder email
        student_email = "#{@student.student_id}@example.com"
        MeklitMailer.exam_result(@exam_booking, student_email).deliver_later
      rescue StandardError => e
        Rails.logger.error "[ExamBookingsController] Failed to send result email: #{e.message}"
        # Don't fail the request if email fails
      end
    end
  end
end
