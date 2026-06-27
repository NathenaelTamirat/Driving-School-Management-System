# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Api::V1::LicenseUpgrades", type: :request do
  def auth_headers(user)
    token = Warden::JWTAuth::UserEncoder.new.call(user, :user, nil).first
    { "Authorization" => "Bearer #{token}" }
  end

  let(:admin) { create(:user, :admin) }
  let(:clerk) { create(:user, :clerk) }
  let(:student_user) { create(:user) }

  let(:student) { create(:student, batch: create(:batch)) }
  let!(:upgrade) { create(:license_upgrade, student: student) }

  describe "GET /api/v1/license_upgrades" do
    it "requires authentication" do
      get "/api/v1/license_upgrades"
      expect(response).to have_http_status(:unauthorized)
    end

    it "allows admin to view all" do
      get "/api/v1/license_upgrades", headers: auth_headers(admin)
      expect(response).to have_http_status(:ok)
      body = JSON.parse(response.body)
      expect(body["data"].size).to eq(1)
    end

    it "allows clerk to view all" do
      get "/api/v1/license_upgrades", headers: auth_headers(clerk)
      expect(response).to have_http_status(:ok)
    end

    it "forbids students" do
      get "/api/v1/license_upgrades", headers: auth_headers(student_user)
      expect(response).to have_http_status(:forbidden)
    end
  end

  describe "POST /api/v1/license_upgrades" do
    it "creates a license upgrade request" do
      params = {
        license_upgrade: {
          student_id: student.id,
          prior_license_key: "AA-12345678",
          license_origin: "Addis Ababa",
          license_issue_date: 5.years.ago.to_date,
          target_category: "Public 2"
        }
      }
      expect {
        post "/api/v1/license_upgrades", params: params, headers: auth_headers(clerk)
      }.to change(LicenseUpgrade, :count).by(1)
      expect(response).to have_http_status(:created)
    end
  end

  describe "POST /api/v1/license_upgrades/:id/approve" do
    it "approves a pending upgrade" do
      post "/api/v1/license_upgrades/#{upgrade.id}/approve", headers: auth_headers(clerk)
      expect(response).to have_http_status(:ok)
      expect(upgrade.reload.status).to eq("approved")
    end
  end

  describe "POST /api/v1/license_upgrades/:id/reject" do
    it "rejects a pending upgrade" do
      post "/api/v1/license_upgrades/#{upgrade.id}/reject",
           params: { reason: "Insufficient documentation" },
           headers: auth_headers(clerk)
      expect(response).to have_http_status(:ok)
      expect(upgrade.reload.status).to eq("rejected")
      expect(upgrade.rejection_reason).to eq("Insufficient documentation")
    end
  end
end
