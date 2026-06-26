# frozen_string_literal: true

require 'rails_helper'

RSpec.describe 'Api::V1::Batches', type: :request do
  def auth_headers(user)
    token = Warden::JWTAuth::UserEncoder.new.call(user, :user, nil).first
    { "Authorization" => "Bearer #{token}" }
  end

  let(:user) { create(:user) }

  describe 'GET /api/v1/batches' do
    it 'requires authentication' do
      get '/api/v1/batches'
      expect(response).to have_http_status(:unauthorized)
    end

    it 'returns all batches when authenticated' do
      create_list(:batch, 3)
      get '/api/v1/batches', headers: auth_headers(user)
      expect(response).to have_http_status(:ok)
      body = JSON.parse(response.body)
      expect(body['success']).to be true
      expect(body['data']['batches'].size).to eq(3)
      expect(body['data']['meta']['total']).to eq(3)
    end
  end

  describe 'GET /api/v1/batches/:id' do
    let(:batch) { create(:batch) }

    it 'returns a specific batch' do
      get "/api/v1/batches/#{batch.id}", headers: auth_headers(user)
      expect(response).to have_http_status(:ok)
      expect(JSON.parse(response.body)['id']).to eq(batch.id)
    end

    it 'returns 404 for non-existent batch' do
      get '/api/v1/batches/99999', headers: auth_headers(user)
      expect(response).to have_http_status(:not_found)
    end
  end

  describe 'POST /api/v1/batches' do
    it 'creates a new batch' do
      batch_params = { batch: { name: 'Batch Test' } }
      expect {
        post '/api/v1/batches', params: batch_params, headers: auth_headers(user)
      }.to change(Batch, :count).by(1)
      expect(response).to have_http_status(:created)
    end

    it 'returns errors for invalid params' do
      post '/api/v1/batches', params: { batch: { name: '' } }, headers: auth_headers(user)
      expect(response).to have_http_status(:unprocessable_entity)
    end
  end
end
