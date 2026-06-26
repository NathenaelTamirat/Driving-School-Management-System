# frozen_string_literal: true

require "rails_helper"

RSpec.configure do |config|
  config.swagger_root = Rails.root.join("swagger").to_s

  config.swagger_docs = {
    "v1/swagger.json" => {
      swagger: "2.0",
      info: {
        title: "Driving School Management System API",
        version: "v1",
        description: "API for managing Ethiopian driving school operations — student enrolment, LMS attendance, mock tests, exam booking, ERTA/government batch submission, graduation, and invoicing."
      },
      basePath: "/api/v1",
      securityDefinitions: {
        Bearer: {
          type: :apiKey,
          name: "Authorization",
          in: :header,
          description: "JWT token obtained from POST /api/v1/auth/login"
        }
      },
      definitions: {
        Student: {
          type: :object,
          properties: {
            id: { type: :integer },
            student_id: { type: :string },
            document_id: { type: :string },
            first_name: { type: :string },
            middle_name: { type: :string },
            last_name: { type: :string },
            date_of_birth: { type: :string, format: :date },
            blood_type: { type: :string },
            address: { type: :string },
            city: { type: :string },
            subcity: { type: :string },
            woreda: { type: :string },
            kebele: { type: :string },
            house_number: { type: :string },
            status: { type: :string },
            verified: { type: :boolean },
            theory_days_completed: { type: :integer },
            practical_days_completed: { type: :integer },
            mock_test_score: { type: :integer },
            under_penalty: { type: :boolean },
            batch_id: { type: :integer }
          }
        },
        Batch: {
          type: :object,
          properties: {
            id: { type: :integer },
            name: { type: :string },
            status: { type: :string, enum: %w[pending submitted approved rejected] },
            submitted_at: { type: :string, format: :"date-time" },
            approved_at: { type: :string, format: :"date-time" },
            rejection_reason: { type: :string }
          }
        },
        ExamBooking: {
          type: :object,
          properties: {
            id: { type: :integer },
            student_id: { type: :integer },
            exam_type: { type: :string, enum: %w[theory practical] },
            scheduled_date: { type: :string, format: :"date-time" },
            status: { type: :string, enum: %w[scheduled completed cancelled no_show] },
            score: { type: :integer },
            venue: { type: :string },
            notes: { type: :string },
            completed_at: { type: :string, format: :"date-time" }
          }
        },
        AttendanceLog: {
          type: :object,
          properties: {
            id: { type: :integer },
            student_id: { type: :integer },
            phase: { type: :string, enum: %w[theory practical] },
            attendance_date: { type: :string, format: :date },
            present: { type: :boolean },
            locked: { type: :boolean },
            instructor_name: { type: :string },
            digital_signature: { type: :string },
            notes: { type: :string }
          }
        },
        MockTest: {
          type: :object,
          properties: {
            id: { type: :integer },
            student_id: { type: :integer },
            score: { type: :integer },
            test_date: { type: :string, format: :date },
            result: { type: :string, enum: %w[passed remedial pending] }
          }
        },
        User: {
          type: :object,
          properties: {
            id: { type: :integer },
            email: { type: :string },
            full_name: { type: :string },
            role: { type: :string, enum: %w[admin instructor clerk student] },
            phone_number: { type: :string },
            is_qualified_instructor: { type: :boolean },
            instructor_license_number: { type: :string },
            instructor_category: { type: :string },
            years_experience: { type: :integer }
          }
        },
        LicenseCategory: {
          type: :object,
          properties: {
            id: { type: :string },
            name: { type: :string },
            description: { type: :string },
            price: { type: :integer },
            currency: { type: :string },
            age_requirement: { type: :integer },
            theory_hours: { type: :integer },
            practical_hours: { type: :integer }
          }
        },
        LmsProgress: {
          type: :object,
          properties: {
            theory_percent: { type: :number, format: :float },
            practical_percent: { type: :number, format: :float },
            theory_days_completed: { type: :integer },
            practical_days_completed: { type: :integer },
            theory_days_required: { type: :integer },
            practical_days_required: { type: :integer },
            mock_test_status: { type: :string },
            current_step: { type: :string },
            next_step: { type: :string }
          }
        },
        PaginationMeta: {
          type: :object,
          properties: {
            page: { type: :integer },
            per_page: { type: :integer },
            total: { type: :integer }
          }
        },
        ApiError: {
          type: :object,
          properties: {
            success: { type: :boolean, enum: [false] },
            error: {
              type: :object,
              properties: {
                message: { type: :string },
                code: { type: :string },
                details: { type: :object }
              }
            }
          }
        }
      }
    }
  }
end
