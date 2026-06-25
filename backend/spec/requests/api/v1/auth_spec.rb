# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Api::V1::Auth", type: :request do
  def json
    JSON.parse(response.body)
  end

  def auth_headers(user)
    token = Warden::JWTAuth::UserEncoder.new.call(user, :user, nil).first
    { "Authorization" => "Bearer #{token}" }
  end

  describe "POST /api/v1/auth/register" do
    it "creates a student and returns a token" do
      post "/api/v1/auth/register",
           params: { auth: { email: "new@example.com", password: "Password123!", full_name: "New User" } },
           as: :json

      expect(response).to have_http_status(:created)
      expect(json["data"]["token"]).to be_present
      expect(json["data"]["user"]["role"]).to eq("student")
    end

    it "forces the role to student even if another role is supplied" do
      post "/api/v1/auth/register",
           params: { auth: { email: "sneaky@example.com", password: "Password123!", full_name: "Sneaky", role: "admin" } },
           as: :json

      expect(json["data"]["user"]["role"]).to eq("student")
    end

    it "rejects invalid input" do
      post "/api/v1/auth/register",
           params: { auth: { email: "bad", password: "x", full_name: "" } },
           as: :json

      expect(response).to have_http_status(:unprocessable_entity)
    end
  end

  describe "POST /api/v1/auth/login" do
    let!(:user) { create(:user, email: "log@example.com", password: "Password123!") }

    it "returns a token with valid credentials" do
      post "/api/v1/auth/login",
           params: { auth: { email: "log@example.com", password: "Password123!" } },
           as: :json

      expect(response).to have_http_status(:ok)
      expect(json["data"]["token"]).to be_present
    end

    it "rejects invalid credentials" do
      post "/api/v1/auth/login",
           params: { auth: { email: "log@example.com", password: "wrong" } },
           as: :json

      expect(response).to have_http_status(:unauthorized)
    end
  end

  describe "GET /api/v1/auth/me" do
    let(:user) { create(:user) }

    it "requires authentication" do
      get "/api/v1/auth/me"
      expect(response).to have_http_status(:unauthorized)
    end

    it "returns the current user when authenticated" do
      get "/api/v1/auth/me", headers: auth_headers(user)
      expect(response).to have_http_status(:ok)
      expect(json["data"]["user"]["id"]).to eq(user.id)
    end
  end
end
