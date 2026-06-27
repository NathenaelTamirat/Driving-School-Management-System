# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Api::V1::RenewalRequests", type: :request do
  def auth_headers(user)
    token = Warden::JWTAuth::UserEncoder.new.call(user, :user, nil).first
    { "Authorization" => "Bearer #{token}" }
  end

  let(:admin) { create(:user, :admin) }
  let(:clerk) { create(:user, :clerk) }
  let(:any_user) { create(:user) }

  let!(:renewal_request) { create(:renewal_request) }

  describe "GET /api/v1/renewal_requests" do
    it "requires authentication" do
      get "/api/v1/renewal_requests"
      expect(response).to have_http_status(:unauthorized)
    end

    it "allows admin to view all" do
      get "/api/v1/renewal_requests", headers: auth_headers(admin)
      expect(response).to have_http_status(:ok)
      body = JSON.parse(response.body)
      expect(body["data"].size).to eq(1)
    end

    it "allows clerk to view all" do
      get "/api/v1/renewal_requests", headers: auth_headers(clerk)
      expect(response).to have_http_status(:ok)
    end

    it "forbids non-staff" do
      get "/api/v1/renewal_requests", headers: auth_headers(any_user)
      expect(response).to have_http_status(:forbidden)
    end
  end

  describe "POST /api/v1/renewal_requests" do
    it "allows any authenticated user to create" do
      params = {
        renewal_request: {
          full_name: "John Doe",
          phone_number: "+251911223344",
          prior_license_number: "AA-87654321",
          registered_kifle_ketema: "Bole"
        }
      }
      expect {
        post "/api/v1/renewal_requests", params: params, headers: auth_headers(any_user)
      }.to change(RenewalRequest, :count).by(1)
      expect(response).to have_http_status(:created)
    end
  end

  describe "POST /api/v1/renewal_requests/:id/submit" do
    it "submits a pending request" do
      post "/api/v1/renewal_requests/#{renewal_request.id}/submit", headers: auth_headers(clerk)
      expect(response).to have_http_status(:ok)
      expect(renewal_request.reload.status).to eq("submitted")
    end
  end

  describe "POST /api/v1/renewal_requests/:id/complete" do
    it "completes a request" do
      post "/api/v1/renewal_requests/#{renewal_request.id}/complete", headers: auth_headers(clerk)
      expect(response).to have_http_status(:ok)
      expect(renewal_request.reload.status).to eq("completed")
    end
  end

  describe "POST /api/v1/renewal_requests/:id/reject" do
    it "rejects a request" do
      post "/api/v1/renewal_requests/#{renewal_request.id}/reject", headers: auth_headers(clerk)
      expect(response).to have_http_status(:ok)
      expect(renewal_request.reload.status).to eq("rejected")
    end
  end
end
