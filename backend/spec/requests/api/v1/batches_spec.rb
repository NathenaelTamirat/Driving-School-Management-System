# frozen_string_literal: true

require 'rails_helper'

RSpec.describe 'Api::V1::Batches', type: :request do
  def auth_headers(user)
    token = Warden::JWTAuth::UserEncoder.new.call(user, :user, nil).first
    { "Authorization" => "Bearer #{token}" }
  end

  let(:admin) { create(:user, role: 'admin') }
  let!(:batch) { create(:batch, name: 'Batch A') }
  let!(:batch2) { create(:batch, name: 'Batch B') }

  describe 'GET /api/v1/batches' do
    it 'requires authentication' do
      get '/api/v1/batches'
      expect(response).to have_http_status(:unauthorized)
    end

    it 'returns all batches' do
      get '/api/v1/batches', headers: auth_headers(admin)
      expect(response).to have_http_status(:ok)
      body = JSON.parse(response.body)
      expect(body['data']['batches']).to be_an(Array)
      expect(body['data']['batches'].length).to eq(2)
    end

    it 'supports pagination' do
      get '/api/v1/batches?page=1&per_page=1', headers: auth_headers(admin)
      body = JSON.parse(response.body)
      expect(body['data']['batches'].length).to eq(1)
      expect(body['data']['meta']['page']).to eq(1)
    end
  end

  describe 'GET /api/v1/batches/:id' do
    it 'returns a batch by id' do
      get "/api/v1/batches/#{batch.id}", headers: auth_headers(admin)
      expect(response).to have_http_status(:ok)
      expect(JSON.parse(response.body)['data']['name']).to eq('Batch A')
    end

    it 'returns 404 for missing batch' do
      get '/api/v1/batches/0', headers: auth_headers(admin)
      expect(response).to have_http_status(:not_found)
    end
  end

  describe 'POST /api/v1/batches' do
    let(:valid_params) { { batch: { name: 'New Batch', status: 'pending' } } }

    it 'creates a batch' do
      expect {
        post '/api/v1/batches', params: valid_params, headers: auth_headers(admin)
      }.to change(Batch, :count).by(1)
      expect(response).to have_http_status(:created)
    end

    it 'returns error for missing name' do
      post '/api/v1/batches', params: { batch: { status: 'pending' } }, headers: auth_headers(admin)
      expect(response).to have_http_status(:unprocessable_entity)
    end
  end
end
