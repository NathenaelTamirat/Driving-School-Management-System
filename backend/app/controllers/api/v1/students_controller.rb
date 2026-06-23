# frozen_string_literal: true

module Api
  module V1
    class StudentsController < ApplicationController
      before_action :set_student, only: [:show]

      # GET /api/v1/students
      def index
        @students = Student.all
        render json: @students
      end

      # GET /api/v1/students/:id
      def show
        render json: @student
      end

      # POST /api/v1/students
      def create
        @student = Student.new(student_params)

        if @student.save
          render json: @student, status: :created
        else
          render json: { errors: @student.errors.full_messages }, status: :unprocessable_entity
        end
      end

      private

      def set_student
        @student = Student.find(params[:id])
      rescue ActiveRecord::RecordNotFound
        render json: { error: 'Student not found' }, status: :not_found
      end

      def student_params
        params.require(:student).permit(
          :batch_id,
          :student_id,
          :document_id,
          :first_name,
          :middle_name,
          :last_name,
          :date_of_birth,
          :blood_type,
          :address,
          :house_number,
          :kebele,
          :woreda,
          :subcity,
          :city,
          :verified,
          :verified_at,
          :theory_days_completed,
          :practical_days_completed,
          :mock_test_score
        )
      end
    end
  end
end
