# frozen_string_literal: true

require "swagger_helper"

RSpec.describe "API V1", swagger_doc: "v1/swagger.json", type: :request do
  let(:user) { create(:user) }
  let(:batch) { create(:batch) }
  let(:student) { create(:student, batch: batch) }
  let(:exam_booking) { create(:exam_booking, student: student) }
  let(:Authorization) { "Bearer #{Warden::JWTAuth::UserEncoder.new.call(user, :user, nil).first}" }

  # ── Auth ──────────────────────────────────────────────────────────────

  path "/auth/register" do
    post "Register a new user" do
      tags "Authentication"
      consumes "application/json"
      produces "application/json"
      parameter name: :auth, in: :body, required: true, schema: {
        type: :object,
        properties: {
          auth: {
            type: :object,
            properties: {
              email: { type: :string },
              password: { type: :string },
              full_name: { type: :string }
            },
            required: %w[email password full_name]
          }
        }
      }

      response "201", "User registered successfully" do
        let(:auth) { { auth: { email: "new@example.com", password: "Password123!", full_name: "New User" } } }
        run_test! do |response|
          body = JSON.parse(response.body)
          expect(body["success"]).to be true
          expect(body["data"]["token"]).to be_present
        end
      end

      response "422", "Invalid input" do
        let(:auth) { { auth: { email: "bad", password: "x", full_name: "" } } }
        run_test!
      end
    end
  end

  path "/auth/login" do
    post "Log in" do
      tags "Authentication"
      consumes "application/json"
      produces "application/json"
      parameter name: :auth, in: :body, required: true, schema: {
        type: :object,
        properties: {
          auth: {
            type: :object,
            properties: {
              email: { type: :string },
              password: { type: :string }
            },
            required: %w[email password]
          }
        }
      }

      let!(:existing_user) { create(:user, email: "login@example.com", password: "Password123!") }

      response "200", "Login successful" do
        let(:auth) { { auth: { email: "login@example.com", password: "Password123!" } } }
        run_test! do |response|
          body = JSON.parse(response.body)
          expect(body["data"]["token"]).to be_present
        end
      end

      response "401", "Invalid credentials" do
        let(:auth) { { auth: { email: "login@example.com", password: "wrong" } } }
        run_test!
      end
    end
  end

  path "/auth/me" do
    get "Get current user" do
      tags "Authentication"
      produces "application/json"
      security [Bearer: []]

      response "200", "Current user data" do
        run_test! do |response|
          body = JSON.parse(response.body)
          expect(body["data"]["user"]["id"]).to eq(user.id)
        end
      end

      response "401", "Not authenticated" do
        let(:Authorization) { nil }
        run_test!
      end
    end
  end

  path "/auth/logout" do
    delete "Log out" do
      tags "Authentication"
      produces "application/json"
      security [Bearer: []]

      response "200", "Logged out successfully" do
        run_test!
      end
    end
  end

  # ── Students ──────────────────────────────────────────────────────────

  path "/students" do
    get "List students" do
      tags "Students"
      produces "application/json"
      security [Bearer: []]
      parameter name: :page, in: :query, type: :integer, required: false, description: "Page number (default: 1)"
      parameter name: :per_page, in: :query, type: :integer, required: false, description: "Items per page (default: 50, max: 200)"

      response "200", "Students list with pagination meta" do
        before { create_list(:student, 3, batch: batch) }
        run_test! do |response|
          body = JSON.parse(response.body)
          expect(body["success"]).to be true
          expect(body["data"]["students"].size).to eq(3)
          expect(body["data"]["meta"]["total"]).to eq(3)
        end
      end

      response "401", "Not authenticated" do
        let(:Authorization) { nil }
        run_test!
      end
    end

    post "Create a student" do
      tags "Students"
      consumes "application/json"
      produces "application/json"
      security [Bearer: []]
      parameter name: :student, in: :body, required: true, schema: {
        type: :object,
        properties: {
          student: {
            type: :object,
            properties: {
              batch_id: { type: :integer },
              student_id: { type: :string },
              document_id: { type: :string },
              first_name: { type: :string },
              middle_name: { type: :string },
              last_name: { type: :string },
              date_of_birth: { type: :string, format: :date },
              blood_type: { type: :string },
              address: { type: :string },
              house_number: { type: :string },
              woreda: { type: :string },
              city: { type: :string }
            },
            required: %w[batch_id student_id document_id first_name middle_name last_name date_of_birth blood_type address house_number woreda city]
          }
        }
      }

      response "201", "Student created" do
        let(:student) do
          {
            student: {
              batch_id: batch.id,
              student_id: "STU123456",
              document_id: "DOC123456",
              first_name: "John",
              middle_name: "Doe",
              last_name: "Smith",
              date_of_birth: "1990-01-01",
              blood_type: "A+",
              address: "123 Main St",
              house_number: "10",
              woreda: "Woreda 1",
              city: "Addis Ababa"
            }
          }
        end
        run_test!
      end

      response "422", "Invalid input" do
        let(:student) { { student: { batch_id: batch.id, first_name: "John" } } }
        run_test!
      end
    end
  end

  path "/students/{id}" do
    get "Get a student" do
      tags "Students"
      produces "application/json"
      security [Bearer: []]
      parameter name: :id, in: :path, type: :integer, required: true

      response "200", "Student data" do
        let(:id) { student.id }
        run_test! do |response|
          body = JSON.parse(response.body)
          expect(body["id"]).to eq(student.id)
        end
      end

      response "404", "Student not found" do
        let(:id) { 99_999 }
        run_test!
      end
    end
  end

  # ── Batches ───────────────────────────────────────────────────────────

  path "/batches" do
    get "List batches" do
      tags "Batches"
      produces "application/json"
      security [Bearer: []]
      parameter name: :page, in: :query, type: :integer, required: false
      parameter name: :per_page, in: :query, type: :integer, required: false

      response "200", "Batches list with pagination meta" do
        before { create_list(:batch, 3) }
        run_test! do |response|
          body = JSON.parse(response.body)
          expect(body["success"]).to be true
          expect(body["data"]["batches"].size).to eq(3)
        end
      end

      response "401", "Not authenticated" do
        let(:Authorization) { nil }
        run_test!
      end
    end

    post "Create a batch" do
      tags "Batches"
      consumes "application/json"
      produces "application/json"
      security [Bearer: []]
      parameter name: :batch, in: :body, required: true, schema: {
        type: :object,
        properties: {
          batch: {
            type: :object,
            properties: {
              name: { type: :string },
              status: { type: :string }
            },
            required: %w[name]
          }
        }
      }

      response "201", "Batch created" do
        let(:batch) { { batch: { name: "New Batch" } } }
        run_test!
      end

      response "422", "Invalid input" do
        let(:batch) { { batch: { name: "" } } }
        run_test!
      end
    end
  end

  path "/batches/{id}" do
    get "Get a batch" do
      tags "Batches"
      produces "application/json"
      security [Bearer: []]
      parameter name: :id, in: :path, type: :integer, required: true

      response "200", "Batch data" do
        let(:id) { create(:batch).id }
        run_test! do |response|
          body = JSON.parse(response.body)
          expect(body["id"]).to be_present
        end
      end

      response "404", "Batch not found" do
        let(:id) { 99_999 }
        run_test!
      end
    end
  end

  # ── Exam Bookings ─────────────────────────────────────────────────────

  path "/students/{student_id}/exam_bookings" do
    get "List exam bookings for a student" do
      tags "Exam Bookings"
      produces "application/json"
      security [Bearer: []]
      parameter name: :student_id, in: :path, type: :integer, required: true

      response "200", "Exam bookings list" do
        let(:student_id) { student.id }
        before { create_list(:exam_booking, 3, student: student) }
        run_test!
      end
    end

    post "Create an exam booking" do
      tags "Exam Bookings"
      consumes "application/json"
      produces "application/json"
      security [Bearer: []]
      parameter name: :student_id, in: :path, type: :integer, required: true
      parameter name: :exam_booking, in: :body, required: true, schema: {
        type: :object,
        properties: {
          exam_booking: {
            type: :object,
            properties: {
              exam_type: { type: :string, enum: %w[theory practical] },
              scheduled_date: { type: :string, format: :"date-time" },
              venue: { type: :string }
            },
            required: %w[exam_type scheduled_date]
          }
        }
      }

      response "201", "Exam booking created" do
        let(:student_id) { student.id }
        let(:exam_booking) { { exam_booking: { exam_type: "theory", scheduled_date: 1.month.from_now, venue: "Main Hall" } } }
        run_test!
      end
    end
  end

  path "/students/{student_id}/exam_bookings/{id}" do
    get "Get an exam booking" do
      tags "Exam Bookings"
      produces "application/json"
      security [Bearer: []]
      parameter name: :student_id, in: :path, type: :integer, required: true
      parameter name: :id, in: :path, type: :integer, required: true

      response "200", "Exam booking data" do
        let(:student_id) { student.id }
        let(:id) { exam_booking.id }
        run_test!
      end
    end

    patch "Update an exam booking" do
      tags "Exam Bookings"
      consumes "application/json"
      produces "application/json"
      security [Bearer: []]
      parameter name: :student_id, in: :path, type: :integer, required: true
      parameter name: :id, in: :path, type: :integer, required: true
      parameter name: :exam_booking, in: :body, required: true, schema: {
        type: :object,
        properties: {
          exam_booking: {
            type: :object,
            properties: {
              venue: { type: :string },
              notes: { type: :string }
            }
          }
        }
      }

      response "200", "Exam booking updated" do
        let(:student_id) { student.id }
        let(:id) { exam_booking.id }
        let(:exam_booking) { { exam_booking: { venue: "New Venue" } } }
        run_test!
      end
    end
  end

  path "/students/{student_id}/exam_bookings/{id}/cancel" do
    post "Cancel an exam booking" do
      tags "Exam Bookings"
      produces "application/json"
      security [Bearer: []]
      parameter name: :student_id, in: :path, type: :integer, required: true
      parameter name: :id, in: :path, type: :integer, required: true

      response "200", "Exam booking cancelled" do
        let(:student_id) { student.id }
        let(:id) { exam_booking.id }
        run_test! do
          expect(exam_booking.reload.status).to eq("cancelled")
        end
      end
    end
  end

  path "/students/{student_id}/exam_bookings/{id}/record_result" do
    post "Record exam result" do
      tags "Exam Bookings"
      consumes "application/json"
      produces "application/json"
      security [Bearer: []]
      parameter name: :student_id, in: :path, type: :integer, required: true
      parameter name: :id, in: :path, type: :integer, required: true
      parameter name: :exam_booking, in: :body, required: true, schema: {
        type: :object,
        properties: {
          exam_booking: {
            type: :object,
            properties: {
              score: { type: :integer },
              notes: { type: :string }
            },
            required: %w[score]
          }
        }
      }

      response "200", "Score recorded (passing)" do
        let(:student_id) { student.id }
        let(:id) { exam_booking.id }
        let(:exam_booking) { { exam_booking: { score: 75, notes: "Good performance" } } }
        run_test! do
          expect(exam_booking.reload.status).to eq("completed")
        end
      end

      response "200", "Score recorded (failing, penalty applied)" do
        let(:student_id) { student.id }
        let(:id) { exam_booking.id }
        let(:exam_booking) { { exam_booking: { score: 30, notes: "Needs improvement" } } }
        run_test! do
          expect(exam_booking.reload.status).to eq("completed")
          expect(student.reload.under_penalty).to be true
        end
      end
    end
  end

  # ── Attendance Logs ───────────────────────────────────────────────────

  path "/students/{student_id}/attendance_logs" do
    get "List attendance logs for a student" do
      tags "Attendance Logs"
      produces "application/json"
      security [Bearer: []]
      parameter name: :student_id, in: :path, type: :integer, required: true
      parameter name: :phase, in: :query, type: :string, required: false, description: "Filter by phase (theory/practical)"
      parameter name: :date, in: :query, type: :string, required: false, description: "Filter by date (YYYY-MM-DD)"
      parameter name: :present, in: :query, type: :boolean, required: false

      response "200", "Attendance logs list" do
        let(:student_id) { student.id }
        before { create_list(:attendance_log, 3, student: student) }
        run_test! do |response|
          body = JSON.parse(response.body)
          expect(body["success"]).to be true
          expect(body["data"].size).to eq(3)
        end
      end
    end

    post "Create an attendance log" do
      tags "Attendance Logs"
      consumes "application/json"
      produces "application/json"
      security [Bearer: []]
      parameter name: :student_id, in: :path, type: :integer, required: true
      parameter name: :attendance_log, in: :body, required: true, schema: {
        type: :object,
        properties: {
          attendance_log: {
            type: :object,
            properties: {
              phase: { type: :string, enum: %w[theory practical] },
              attendance_date: { type: :string, format: :date },
              present: { type: :boolean },
              instructor_name: { type: :string }
            },
            required: %w[phase attendance_date present]
          }
        }
      }

      response "201", "Attendance logged" do
        let(:student_id) { student.id }
        let(:attendance_log) { { attendance_log: { phase: "theory", attendance_date: Date.today, present: true } } }
        run_test!
      end
    end
  end

  # ── Mock Tests ────────────────────────────────────────────────────────

  path "/students/{student_id}/mock_tests" do
    get "List mock tests for a student" do
      tags "Mock Tests"
      produces "application/json"
      security [Bearer: []]
      parameter name: :student_id, in: :path, type: :integer, required: true

      response "200", "Mock tests list" do
        let(:student_id) { student.id }
        before { create_list(:mock_test, 3, student: student) }
        run_test! do |response|
          body = JSON.parse(response.body)
          expect(body["success"]).to be true
          expect(body["data"].size).to eq(3)
        end
      end
    end

    post "Create a mock test" do
      tags "Mock Tests"
      consumes "application/json"
      produces "application/json"
      security [Bearer: []]
      parameter name: :student_id, in: :path, type: :integer, required: true
      parameter name: :mock_test, in: :body, required: true, schema: {
        type: :object,
        properties: {
          mock_test: {
            type: :object,
            properties: {
              score: { type: :integer },
              test_date: { type: :string, format: :date }
            },
            required: %w[score test_date]
          }
        }
      }

      response "201", "Mock test recorded" do
        let(:student_id) { student.id }
        let(:mock_test) { { mock_test: { score: 75, test_date: Date.today } } }
        run_test!
      end
    end
  end

  # ── LMS Progress ──────────────────────────────────────────────────────

  path "/students/{student_id}/lms_progress" do
    get "Get student LMS progress" do
      tags "LMS Progress"
      produces "application/json"
      security [Bearer: []]
      parameter name: :student_id, in: :path, type: :integer, required: true

      response "200", "Progress data" do
        let(:student_id) { student.id }
        run_test! do |response|
          body = JSON.parse(response.body)
          expect(body["success"]).to be true
          expect(body["data"]).to have_key("theory_percent")
        end
      end

      response "404", "Student not found" do
        let(:student_id) { 99_999 }
        run_test!
      end
    end
  end

  # ── License Categories ────────────────────────────────────────────────

  path "/license_categories" do
    get "List license categories" do
      tags "License Categories"
      produces "application/json"
      security [Bearer: []]

      response "200", "License categories with pricing" do
        run_test! do |response|
          body = JSON.parse(response.body)
          expect(body).to be_an(Array)
          expect(body.size).to eq(4)
        end
      end
    end
  end

  # ── Users ─────────────────────────────────────────────────────────────

  path "/users" do
    get "List users" do
      tags "Users"
      produces "application/json"
      security [Bearer: []]

      response "200", "Users list" do
        let(:user) { create(:user, :admin) }
        run_test! do |response|
          body = JSON.parse(response.body)
          expect(body["success"]).to be true
        end
      end

      response "403", "Forbidden for non-admin" do
        run_test!
      end
    end

    post "Create a user" do
      tags "Users"
      consumes "application/json"
      produces "application/json"
      security [Bearer: []]
      parameter name: :user_params, in: :body, required: true, schema: {
        type: :object,
        properties: {
          user: {
            type: :object,
            properties: {
              email: { type: :string },
              password: { type: :string },
              full_name: { type: :string },
              role: { type: :string, enum: %w[admin instructor clerk student] }
            },
            required: %w[email password full_name]
          }
        }
      }

      response "201", "User created" do
        let(:user) { create(:user, :admin) }
        let(:user_params) { { user: { email: "inst@example.com", password: "Password123!", full_name: "Inst", role: "instructor", instructor_license_number: "LIC-9" } } }
        run_test!
      end

      response "403", "Forbidden for non-admin" do
        let(:user_params) { { user: { email: "x@example.com", password: "Password123!", full_name: "X" } } }
        run_test!
      end
    end
  end
end
