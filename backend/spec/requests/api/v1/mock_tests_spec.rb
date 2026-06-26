# frozen_string_literal: true

require 'rails_helper'

RSpec.describe 'Api::V1::MockTests', type: :request do
  def auth_headers(user)
    token = Warden::JWTAuth::UserEncoder.new.call(user, :user, nil).first
    { "Authorization" => "Bearer #{token}" }
  end

  let(:user) { create(:user) }
  let(:batch) { create(:batch) }
  let(:student) { create(:student, batch: batch) }

  describe 'GET /api/v1/students/:student_id/mock_tests' do
    it 'requires authentication' do
      get "/api/v1/students/#{student.id}/mock_tests"
      expect(response).to have_http_status(:unauthorized)
    end

    it 'returns mock tests for a student' do
      create_list(:mock_test, 3, student: student)
      get "/api/v1/students/#{student.id}/mock_tests", headers: auth_headers(user)
      expect(response).to have_http_status(:ok)
      body = JSON.parse(response.body)
      expect(body['success']).to be true
      expect(body['data'].size).to eq(3)
    end
  end

  describe 'POST /api/v1/students/:student_id/mock_tests' do
    it 'creates a mock test' do
      test_params = {
        mock_test: {
          score: 75,
          test_date: Date.today
        }
      }
      expect {
        post "/api/v1/students/#{student.id}/mock_tests", params: test_params, headers: auth_headers(user)
      }.to change(MockTest, :count).by(1)
      expect(response).to have_http_status(:created)
      body = JSON.parse(response.body)
      expect(body['success']).to be true
    end

    it 'returns errors for invalid params' do
      test_params = { mock_test: { score: -1 } }
      post "/api/v1/students/#{student.id}/mock_tests", params: test_params, headers: auth_headers(user)
      expect(response).to have_http_status(:unprocessable_entity)
    end
  end
end
