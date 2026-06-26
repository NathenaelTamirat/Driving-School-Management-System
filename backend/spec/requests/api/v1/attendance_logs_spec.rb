# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Api::V1::AttendanceLogs", type: :request do
  def json
    JSON.parse(response.body)
  end

  def auth_headers(user)
    token = Warden::JWTAuth::UserEncoder.new.call(user, :user, nil).first
    { "Authorization" => "Bearer #{token}" }
  end

  let(:instructor) { create(:user, :instructor) }
  let(:student)    { create(:student, status: "theory_in_progress") }

  describe "POST /api/v1/students/:student_id/attendance_logs" do
    let(:valid_params) do
      { attendance_log: { phase: "theory", attendance_date: Date.today.to_s,
                          present: true, instructor_name: "Abebe Kebede" } }
    end

    it "logs attendance and increments the student's theory days" do
      expect do
        post "/api/v1/students/#{student.id}/attendance_logs",
             headers: auth_headers(instructor), params: valid_params, as: :json
      end.to change { student.reload.theory_days_completed }.by(1)

      expect(response).to have_http_status(:created)
    end

    it "returns 422 (not 500) when present is missing" do
      params = { attendance_log: { phase: "theory", attendance_date: Date.today.to_s } }
      post "/api/v1/students/#{student.id}/attendance_logs",
           headers: auth_headers(instructor), params: params, as: :json

      expect(response).to have_http_status(:unprocessable_entity)
    end

    it "requires authentication" do
      post "/api/v1/students/#{student.id}/attendance_logs", params: valid_params, as: :json
      expect(response).to have_http_status(:unauthorized)
    end
  end

  describe "GET /api/v1/students/:student_id/attendance_logs" do
    it "returns 400 (not 500) for a malformed date filter" do
      get "/api/v1/students/#{student.id}/attendance_logs",
          headers: auth_headers(instructor), params: { date: "not-a-date" }

      expect(response).to have_http_status(:bad_request)
    end
  end
end
