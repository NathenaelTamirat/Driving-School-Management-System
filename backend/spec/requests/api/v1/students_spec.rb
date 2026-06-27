# frozen_string_literal: true

require 'rails_helper'

RSpec.describe 'Api::V1::Students', type: :request do
  def auth_headers(user)
    token = Warden::JWTAuth::UserEncoder.new.call(user, :user, nil).first
    { "Authorization" => "Bearer #{token}" }
  end

  let(:clerk) { create(:user, :clerk) }
  let(:batch) { create(:batch) }
  let(:student) { create(:student, batch: batch) }

  describe 'GET /api/v1/students' do
    it 'requires authentication' do
      get '/api/v1/students'
      expect(response).to have_http_status(:unauthorized)
    end

    it 'forbids student role' do
      student_user = create(:user)
      get '/api/v1/students', headers: auth_headers(student_user)
      expect(response).to have_http_status(:forbidden)
    end

    it 'returns all students when authenticated as clerk' do
      create_list(:student, 3, batch: batch)
      get '/api/v1/students', headers: auth_headers(clerk)
      expect(response).to have_http_status(:ok)
      body = JSON.parse(response.body)
      expect(body['success']).to be true
      expect(body['data']['students'].size).to eq(3)
      expect(body['data']['meta']['total']).to eq(3)
      expect(body['data']['meta']['page']).to eq(1)
    end

    it 'paginates results' do
      create_list(:student, 5, batch: batch)
      get '/api/v1/students', params: { page: 1, per_page: 2 }, headers: auth_headers(clerk)
      expect(response).to have_http_status(:ok)
      body = JSON.parse(response.body)
      expect(body['data']['students'].size).to eq(2)
      expect(body['data']['meta']['total']).to eq(5)
      expect(body['data']['meta']['per_page']).to eq(2)
    end

    it 'clamps per_page to maximum of 200' do
      create_list(:student, 3, batch: batch)
      get '/api/v1/students', params: { per_page: 500 }, headers: auth_headers(clerk)
      expect(response).to have_http_status(:ok)
      body = JSON.parse(response.body)
      expect(body['data']['meta']['per_page']).to eq(200)
    end
  end

  describe 'GET /api/v1/students/:id' do
    it 'returns a specific student' do
      get "/api/v1/students/#{student.id}", headers: auth_headers(clerk)
      expect(response).to have_http_status(:ok)
      expect(JSON.parse(response.body)['data']['id']).to eq(student.id)
    end

    it 'returns 404 for non-existent student' do
      get '/api/v1/students/99999', headers: auth_headers(clerk)
      expect(response).to have_http_status(:not_found)
    end
  end

  describe 'POST /api/v1/students' do
    it 'creates a new student' do
      student_params = {
        student: {
          batch_id: batch.id,
          student_id: 'STU123456',
          document_id: 'DOC123456',
          first_name: 'John',
          middle_name: 'Doe',
          last_name: 'Smith',
          date_of_birth: '1990-01-01',
          blood_type: 'A+',
          address: '123 Main St',
          house_number: '10',
          woreda: 'Woreda 1',
          city: 'Addis Ababa'
        }
      }
      expect {
        post '/api/v1/students', params: student_params, headers: auth_headers(clerk)
      }.to change(Student, :count).by(1)
      expect(response).to have_http_status(:created)
    end

    it 'returns errors for invalid params' do
      student_params = {
        student: {
          batch_id: batch.id,
          first_name: 'John'
        }
      }
      post '/api/v1/students', params: student_params, headers: auth_headers(clerk)
      expect(response).to have_http_status(:unprocessable_entity)
    end
  end
end
