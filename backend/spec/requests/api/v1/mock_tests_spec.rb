# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Api::V1::MockTests", type: :request do
  def json
    JSON.parse(response.body)
  end

  def auth_headers(user)
    token = Warden::JWTAuth::UserEncoder.new.call(user, :user, nil).first
    { "Authorization" => "Bearer #{token}" }
  end

  let(:instructor) { create(:user, :instructor) }

  describe "POST /api/v1/students/:student_id/mock_tests" do
    it "records the mock test and syncs the score to the student" do
      student = create(:student, status: "theory_in_progress")

      post "/api/v1/students/#{student.id}/mock_tests",
           headers: auth_headers(instructor),
           params: { mock_test: { score: 80, test_date: Date.today.to_s } }, as: :json

      expect(response).to have_http_status(:created)
      expect(student.reload.mock_test_score).to eq(80)
    end

    it "advances a theory-complete student to practical when the mock passes" do
      # Days are done but the mock had not been passed yet — recording it should
      # be enough to trigger the start_practical transition.
      student = create(:student, status: "theory_in_progress",
                                 theory_days_completed: 35, mock_test_score: 0)

      post "/api/v1/students/#{student.id}/mock_tests",
           headers: auth_headers(instructor),
           params: { mock_test: { score: 50, test_date: Date.today.to_s } }, as: :json

      expect(response).to have_http_status(:created)
      expect(student.reload.status).to eq("practical_in_progress")
    end

    it "does not advance the student when the mock fails" do
      student = create(:student, status: "theory_in_progress",
                                 theory_days_completed: 35, mock_test_score: 0)

      post "/api/v1/students/#{student.id}/mock_tests",
           headers: auth_headers(instructor),
           params: { mock_test: { score: 20, test_date: Date.today.to_s } }, as: :json

      expect(student.reload.status).to eq("theory_in_progress")
    end
  end
end
