# frozen_string_literal: true

module Api
  module V1
    class StudentsController < BaseController
      before_action :set_student, only: [ :show, :update ]

      # GET /api/v1/students
      def index
        authorize Student
        page     = params.fetch(:page, 1).to_i
        per_page = params.fetch(:per_page, 50).to_i.clamp(1, 200)
        @students = Student.order(:created_at).page(page).per(per_page).includes(:batch)
        render_success({
          students: @students.as_json,
          meta: { page: page, per_page: per_page, total: Student.count }
        })
      end

      # GET /api/v1/students/:id
      def show
        authorize Student
        render_success(@student)
      end

      # POST /api/v1/students
      def create
        authorize Student
        @student = Student.new(student_params)

        if @student.save
          # Handle file uploads (stored in memory for now)
          # Files are uploaded via multipart/form-data with student[...] prefix
          # TODO: Implement ActiveStorage for persistent file storage
          handle_file_uploads if params[:student]

          render_success(@student, status: :created)
        else
          render_error("Failed to create student", errors: @student.errors.full_messages)
        end
      end

      # PATCH/PUT /api/v1/students/:id
      def update
        authorize @student

        if @student.update(student_params)
          handle_file_uploads if params[:student]
          render_success(@student)
        else
          render_error("Failed to update student", errors: @student.errors.full_messages)
        end
      end

      private

      def set_student
        @student = Student.find(params[:id])
      rescue ActiveRecord::RecordNotFound
        render_error("Student not found", status: :not_found, code: "NOT_FOUND")
      end

      def student_params
        params.require(:student).permit(
          :batch_id,
          :student_id,
          :document_id,
          :identification_document,
          :eye_acuity_test,
          :meklit_approval_date,
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
          :email,
          :verified,
          :verified_at,
          :license_category,
          :theory_days_completed,
          :practical_days_completed,
          :mock_test_score,
          # File uploads (ActiveStorage)
          :profile_photo,
          :yellow_card,
          :grade_8,
          :grade_10,
          :grade_12,
          :medical
        )
      end

      def handle_file_uploads
        file_fields = %w[profile_photo yellow_card grade_8 grade_10 grade_12 medical]

        file_fields.each do |field|
          next unless params[:student][field].present?

          @student.public_send(field).attach(params[:student][field])
          Rails.logger.info "[StudentsController] Uploaded #{field} for student #{@student.student_id}"
        end
      end
    end
  end
end
