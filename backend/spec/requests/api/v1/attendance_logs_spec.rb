# frozen_string_literal: true

require 'rails_helper'

RSpec.describe 'Api::V1::AttendanceLogs', type: :request do
  def auth_headers(user)
    token = Warden::JWTAuth::UserEncoder.new.call(user, :user, nil).first
    { "Authorization" => "Bearer #{token}" }
  end

  let(:user) { create(:user) }
  let(:batch) { create(:batch) }
  let(:student) { create(:student, batch: batch) }

  describe 'GET /api/v1/students/:student_id/attendance_logs' do
    it 'requires authentication' do
      get "/api/v1/students/#{student.id}/attendance_logs"
      expect(response).to have_http_status(:unauthorized)
    end

    it 'returns attendance logs for a student' do
      create_list(:attendance_log, 3, student: student)
      get "/api/v1/students/#{student.id}/attendance_logs", headers: auth_headers(user)
      expect(response).to have_http_status(:ok)
      body = JSON.parse(response.body)
      expect(body['success']).to be true
      expect(body['data'].size).to eq(3)
    end

    it 'filters by phase' do
      create(:attendance_log, student: student, phase: 'theory')
      create(:attendance_log, :practical, student: student)
      get "/api/v1/students/#{student.id}/attendance_logs", params: { phase: 'practical' }, headers: auth_headers(user)
      expect(response).to have_http_status(:ok)
      body = JSON.parse(response.body)
      expect(body['data'].size).to eq(1)
      expect(body['data'].first['phase']).to eq('practical')
    end
  end

  describe 'POST /api/v1/students/:student_id/attendance_logs' do
    it 'creates an attendance log' do
      log_params = {
        attendance_log: {
          phase: 'theory',
          attendance_date: Date.today,
          present: true,
          instructor_name: 'Instructor A'
        }
      }
      expect {
        post "/api/v1/students/#{student.id}/attendance_logs", params: log_params, headers: auth_headers(user)
      }.to change(AttendanceLog, :count).by(1)
      expect(response).to have_http_status(:created)
      body = JSON.parse(response.body)
      expect(body['success']).to be true
    end

    it 'returns errors for invalid params' do
      log_params = { attendance_log: { phase: '' } }
      post "/api/v1/students/#{student.id}/attendance_logs", params: log_params, headers: auth_headers(user)
      expect(response).to have_http_status(:unprocessable_entity)
    end
  end
end
