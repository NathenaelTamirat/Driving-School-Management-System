# frozen_string_literal: true

require 'rails_helper'

RSpec.describe 'Api::V1::AttendanceLogs', type: :request do
  def auth_headers(user)
    token = Warden::JWTAuth::UserEncoder.new.call(user, :user, nil).first
    { "Authorization" => "Bearer #{token}" }
  end

  let(:clerk) { create(:user, :clerk) }
  let(:batch) { create(:batch) }
  let(:student) { create(:student, batch: batch, status: 'theory_in_progress', theory_days_completed: 10) }
  let!(:log) { create(:attendance_log, student: student, attendance_date: Date.current, phase: 'theory', present: true) }

  describe 'GET /api/v1/students/:student_id/attendance_logs' do
    it 'requires authentication' do
      get "/api/v1/students/#{student.id}/attendance_logs"
      expect(response).to have_http_status(:unauthorized)
    end

    it 'returns attendance logs for a student' do
      get "/api/v1/students/#{student.id}/attendance_logs", headers: auth_headers(clerk)
      expect(response).to have_http_status(:ok)
      body = JSON.parse(response.body)
      expect(body['data']).to be_an(Array)
      expect(body['data'].length).to eq(1)
    end

    it 'filters by phase' do
      create(:attendance_log, student: student, phase: 'practical', attendance_date: Date.yesterday, present: true)
      get "/api/v1/students/#{student.id}/attendance_logs?phase=theory", headers: auth_headers(clerk)
      body = JSON.parse(response.body)
      expect(body['data'].length).to eq(1)
      expect(body['data'].first['phase']).to eq('theory')
    end
  end

  describe 'POST /api/v1/students/:student_id/attendance_logs' do
    let(:valid_params) do
      {
        attendance_log: {
          phase: 'practical',
          attendance_date: Date.current,
          present: true,
          instructor_name: 'Instructor A',
          notes: 'On time'
        }
      }
    end

    it 'creates attendance log' do
      expect {
        post "/api/v1/students/#{student.id}/attendance_logs", params: valid_params, headers: auth_headers(clerk)
      }.to change(AttendanceLog, :count).by(1)
      expect(response).to have_http_status(:created)
    end

    it 'returns error for missing params' do
      post "/api/v1/students/#{student.id}/attendance_logs", params: {}, headers: auth_headers(clerk)
      expect(response).to have_http_status(:bad_request)
    end
  end
end
