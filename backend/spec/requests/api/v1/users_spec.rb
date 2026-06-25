# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Api::V1::Users", type: :request do
  def json
    JSON.parse(response.body)
  end

  def auth_headers(user)
    token = Warden::JWTAuth::UserEncoder.new.call(user, :user, nil).first
    { "Authorization" => "Bearer #{token}" }
  end

  let(:admin) { create(:user, :admin) }
  let(:student) { create(:user) }

  describe "GET /api/v1/users" do
    it "lets an admin list users" do
      create_list(:user, 2)
      get "/api/v1/users", headers: auth_headers(admin)
      expect(response).to have_http_status(:ok)
      expect(json["data"].size).to be >= 3
    end

    it "forbids a non-admin" do
      get "/api/v1/users", headers: auth_headers(student)
      expect(response).to have_http_status(:forbidden)
    end

    it "requires authentication" do
      get "/api/v1/users"
      expect(response).to have_http_status(:unauthorized)
    end
  end

  describe "POST /api/v1/users" do
    it "lets an admin create an instructor" do
      post "/api/v1/users",
           headers: auth_headers(admin),
           params: { user: { email: "inst@example.com", password: "Password123!",
                             full_name: "Inst", role: "instructor", instructor_license_number: "LIC-9" } },
           as: :json

      expect(response).to have_http_status(:created)
      expect(json["data"]["role"]).to eq("instructor")
    end

    it "forbids a non-admin from creating users" do
      post "/api/v1/users",
           headers: auth_headers(student),
           params: { user: { email: "x@example.com", password: "Password123!", full_name: "X", role: "clerk" } },
           as: :json

      expect(response).to have_http_status(:forbidden)
    end
  end
end
