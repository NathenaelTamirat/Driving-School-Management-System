# frozen_string_literal: true

require 'rails_helper'

RSpec.describe 'Api::V1::MockTests', type: :request do
  def auth_headers(user)
    token = Warden::JWTAuth::UserEncoder.new.call(user, :user, nil).first
    { "Authorization" => "Bearer #{token}" }
  end

  let(:clerk) { create(:user, :clerk) }
  let(:batch) { create(:batch) }
  let(:student) { create(:student, batch: batch, status: 'theory_in_progress', theory_days_completed: 35, mock_test_score: 0) }
  let!(:existing_test) { create(:mock_test, student: student, score: 30, test_date: 1.day.ago) }

  describe 'GET /api/v1/students/:student_id/mock_tests' do
    it 'requires authentication' do
      get "/api/v1/students/#{student.id}/mock_tests"
      expect(response).to have_http_status(:unauthorized)
    end

    it 'returns mock tests for a student' do
      get "/api/v1/students/#{student.id}/mock_tests", headers: auth_headers(clerk)
      expect(response).to have_http_status(:ok)
      body = JSON.parse(response.body)
      expect(body['data']).to be_an(Array)
      expect(body['data'].length).to be >= 1
    end
  end

  describe 'POST /api/v1/students/:student_id/mock_tests' do
    let(:valid_params) do
      { mock_test: { score: 85, test_date: Date.current } }
    end

    it 'creates a mock test record' do
      expect {
        post "/api/v1/students/#{student.id}/mock_tests", params: valid_params, headers: auth_headers(clerk)
      }.to change(MockTest, :count).by(1)
      expect(response).to have_http_status(:created)
    end

    it 'syncs score to student record' do
      post "/api/v1/students/#{student.id}/mock_tests", params: valid_params, headers: auth_headers(clerk)
      expect(student.reload.mock_test_score).to eq(85)
    end

    it 'returns error for missing params' do
      post "/api/v1/students/#{student.id}/mock_tests", params: {}, headers: auth_headers(clerk)
      expect(response).to have_http_status(:bad_request)
    end
  end
end
