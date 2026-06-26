# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Api::V1::GraduationRecords", type: :request do
  def json
    JSON.parse(response.body)
  end

  def auth_headers(user)
    token = Warden::JWTAuth::UserEncoder.new.call(user, :user, nil).first
    { "Authorization" => "Bearer #{token}" }
  end

  # Future-dated on create (to satisfy ExamBooking's validation) then marked
  # completed via update_columns so it counts as a passed practical exam.
  def add_passed_practical(student)
    create(:exam_booking, student: student, exam_type: "practical").tap do |booking|
      booking.update_columns(status: "completed", score: 60, completed_at: Time.current)
    end
  end

  let(:instructor) { create(:user, :instructor) }
  let(:student)    { create(:student, status: "exam_eligible") }

  describe "POST /api/v1/students/:student_id/graduation_record" do
    it "graduates an eligible student and creates a record" do
      add_passed_practical(student)
      allow(DossierTransferJob).to receive(:perform_later)

      post "/api/v1/students/#{student.id}/graduation_record",
           headers: auth_headers(instructor), as: :json

      expect(response).to have_http_status(:created)
      expect(student.reload.status).to eq("graduated")
    end

    it "returns 422 when the student has not passed a practical exam" do
      post "/api/v1/students/#{student.id}/graduation_record",
           headers: auth_headers(instructor), as: :json

      expect(response).to have_http_status(:unprocessable_entity)
      expect(json["error"]["details"]).to include("No passed practical exam found")
    end

    it "requires authentication" do
      post "/api/v1/students/#{student.id}/graduation_record", as: :json
      expect(response).to have_http_status(:unauthorized)
    end
  end

  describe "GET /api/v1/students/:student_id/graduation_record" do
    it "returns 404 when no record exists" do
      get "/api/v1/students/#{student.id}/graduation_record", headers: auth_headers(instructor)
      expect(response).to have_http_status(:not_found)
    end
  end
end
