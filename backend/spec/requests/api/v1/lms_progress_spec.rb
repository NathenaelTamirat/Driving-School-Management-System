# frozen_string_literal: true

require 'rails_helper'

RSpec.describe 'Api::V1::LmsProgress', type: :request do
  def auth_headers(user)
    token = Warden::JWTAuth::UserEncoder.new.call(user, :user, nil).first
    { "Authorization" => "Bearer #{token}" }
  end

  let(:user) { create(:user) }
  let(:batch) { create(:batch) }
  let(:student) { create(:student, batch: batch) }

  describe 'GET /api/v1/students/:student_id/lms_progress' do
    it 'requires authentication' do
      get "/api/v1/students/#{student.id}/lms_progress"
      expect(response).to have_http_status(:unauthorized)
    end

    it 'returns progress for a student' do
      get "/api/v1/students/#{student.id}/lms_progress", headers: auth_headers(user)
      expect(response).to have_http_status(:ok)
      body = JSON.parse(response.body)
      expect(body['success']).to be true
      expect(body['data']).to have_key('theory_percent')
      expect(body['data']).to have_key('practical_percent')
    end

    it 'returns 404 for non-existent student' do
      get '/api/v1/students/99999/lms_progress', headers: auth_headers(user)
      expect(response).to have_http_status(:not_found)
    end
  end
end
