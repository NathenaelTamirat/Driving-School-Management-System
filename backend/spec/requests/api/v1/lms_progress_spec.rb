# frozen_string_literal: true

require 'rails_helper'

RSpec.describe 'Api::V1::LmsProgress', type: :request do
  def auth_headers(user)
    token = Warden::JWTAuth::UserEncoder.new.call(user, :user, nil).first
    { "Authorization" => "Bearer #{token}" }
  end

  let(:clerk) { create(:user, :clerk) }
  let(:batch) { create(:batch) }
  let(:student) { create(:student, batch: batch, status: 'theory_in_progress', theory_days_completed: 20, practical_days_completed: 0, mock_test_score: 0) }

  describe 'GET /api/v1/students/:student_id/lms_progress' do
    it 'requires authentication' do
      get "/api/v1/students/#{student.id}/lms_progress"
      expect(response).to have_http_status(:unauthorized)
    end

    it 'returns progress data for a student' do
      get "/api/v1/students/#{student.id}/lms_progress", headers: auth_headers(clerk)
      expect(response).to have_http_status(:ok)
      body = JSON.parse(response.body)
      expect(body['data']).to include('theory', 'practical', 'status', 'next_milestone')
    end

    it 'returns 404 for non-existent student' do
      get '/api/v1/students/0/lms_progress', headers: auth_headers(clerk)
      expect(response).to have_http_status(:not_found)
    end
  end
end
