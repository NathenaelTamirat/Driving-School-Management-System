# frozen_string_literal: true

require 'rails_helper'

RSpec.describe 'Api::V1::ExamBookings', type: :request do
  def auth_headers(user)
    token = Warden::JWTAuth::UserEncoder.new.call(user, :user, nil).first
    { "Authorization" => "Bearer #{token}" }
  end

  let(:user) { create(:user) }
  let(:batch) { create(:batch) }
  let(:student) { create(:student, batch: batch, status: 'exam_eligible', theory_days_completed: 35, practical_days_completed: 52, mock_test_score: 80) }
  let(:exam_booking) { create(:exam_booking, student: student) }

  describe 'GET /api/v1/students/:student_id/exam_bookings' do
    it 'requires authentication' do
      get "/api/v1/students/#{student.id}/exam_bookings"
      expect(response).to have_http_status(:unauthorized)
    end

    it 'returns all exam bookings for a student' do
      create_list(:exam_booking, 3, student: student)
      get "/api/v1/students/#{student.id}/exam_bookings", headers: auth_headers(user)
      expect(response).to have_http_status(:ok)
      expect(JSON.parse(response.body).size).to eq(3)
    end
  end

  describe 'GET /api/v1/students/:student_id/exam_bookings/:id' do
    it 'returns a specific exam booking' do
      get "/api/v1/students/#{student.id}/exam_bookings/#{exam_booking.id}", headers: auth_headers(user)
      expect(response).to have_http_status(:ok)
      expect(JSON.parse(response.body)['id']).to eq(exam_booking.id)
    end
  end

  describe 'POST /api/v1/students/:student_id/exam_bookings' do
    context 'when student is eligible' do
      it 'creates a new exam booking' do
        exam_booking_params = {
          exam_booking: {
            exam_type: 'theory',
            scheduled_date: 1.month.from_now,
            venue: 'Main Hall'
          }
        }
        expect {
          post "/api/v1/students/#{student.id}/exam_bookings", params: exam_booking_params, headers: auth_headers(user)
        }.to change(ExamBooking, :count).by(1)
        expect(response).to have_http_status(:created)
      end
    end

    context 'when student is not eligible' do
      it 'returns forbidden status' do
        student.update!(theory_days_completed: 20)
        exam_booking_params = {
          exam_booking: {
            exam_type: 'theory',
            scheduled_date: 1.month.from_now,
            venue: 'Main Hall'
          }
        }
        post "/api/v1/students/#{student.id}/exam_bookings", params: exam_booking_params, headers: auth_headers(user)
        expect(response).to have_http_status(:forbidden)
        expect(JSON.parse(response.body)['errors']).to include(/Theory training incomplete/)
      end
    end
  end

  describe 'PATCH /api/v1/students/:student_id/exam_bookings/:id' do
    it 'updates an exam booking' do
      update_params = {
        exam_booking: {
          venue: 'New Venue'
        }
      }
      patch "/api/v1/students/#{student.id}/exam_bookings/#{exam_booking.id}", params: update_params, headers: auth_headers(user)
      expect(response).to have_http_status(:ok)
      expect(exam_booking.reload.venue).to eq('New Venue')
    end
  end

  describe 'POST /api/v1/students/:student_id/exam_bookings/:id/cancel' do
    it 'cancels an exam booking' do
      post "/api/v1/students/#{student.id}/exam_bookings/#{exam_booking.id}/cancel", headers: auth_headers(user)
      expect(response).to have_http_status(:ok)
      expect(exam_booking.reload.status).to eq('cancelled')
    end
  end

  describe 'POST /api/v1/students/:student_id/exam_bookings/:id/record_result' do
    context 'when recording a passing score' do
      it 'updates exam with score and marks as completed' do
        result_params = {
          exam_booking: {
            score: 75,
            notes: 'Good performance'
          }
        }
        post "/api/v1/students/#{student.id}/exam_bookings/#{exam_booking.id}/record_result", params: result_params, headers: auth_headers(user)
        expect(response).to have_http_status(:ok)
        expect(exam_booking.reload.status).to eq('completed')
        expect(exam_booking.score).to eq(75)
        expect(student.reload.under_penalty).to be false
      end
    end

    context 'when recording a failing score' do
      it 'updates exam with score and applies penalty' do
        result_params = {
          exam_booking: {
            score: 30,
            notes: 'Needs improvement'
          }
        }
        post "/api/v1/students/#{student.id}/exam_bookings/#{exam_booking.id}/record_result", params: result_params, headers: auth_headers(user)
        expect(response).to have_http_status(:ok)
        expect(exam_booking.reload.status).to eq('completed')
        expect(exam_booking.score).to eq(30)
        expect(student.reload.under_penalty).to be true
        expect(student.penalty_end_date).not_to be_nil
      end
    end
  end
end
