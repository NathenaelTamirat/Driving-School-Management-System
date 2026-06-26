# frozen_string_literal: true

require "rails_helper"

RSpec.describe RenewalRequest, type: :model do
  describe "validations" do
    it { is_expected.to validate_presence_of(:full_name) }
    it { is_expected.to validate_presence_of(:phone_number) }
    it { is_expected.to validate_presence_of(:prior_license_number) }
    it { is_expected.to validate_presence_of(:registered_kifle_ketema) }
    it { is_expected.to validate_presence_of(:status) }
    it { is_expected.to validate_inclusion_of(:status).in_array(RenewalRequest::STATUSES) }
    it { is_expected.to validate_inclusion_of(:blood_type).in_array(%w[A+ A- B+ B- AB+ AB- O+ O-]) }
  end

  describe "#medical_data_complete?" do
    it "returns true when both fields are present" do
      request = build(:renewal_request, blood_type: "A+", eye_acuity_test: "20/20")
      expect(request.medical_data_complete?).to be true
    end

    it "returns false when blood_type is missing" do
      request = build(:renewal_request, blood_type: nil, eye_acuity_test: "20/20")
      expect(request.medical_data_complete?).to be false
    end

    it "returns false when eye_acuity_test is missing" do
      request = build(:renewal_request, blood_type: "A+", eye_acuity_test: nil)
      expect(request.medical_data_complete?).to be false
    end
  end

  describe "#submit!" do
    let(:request) { create(:renewal_request, status: "pending") }

    it "submits the request" do
      request.submit!
      expect(request.status).to eq("submitted")
    end
  end

  describe "#complete!" do
    let(:request) { create(:renewal_request, status: "submitted") }

    it "completes the request" do
      request.complete!
      expect(request.status).to eq("completed")
    end
  end

  describe "#reject!" do
    let(:request) { create(:renewal_request, status: "pending") }

    it "rejects the request" do
      request.reject!
      expect(request.status).to eq("rejected")
    end
  end

  describe "scopes" do
    let!(:pending_req) { create(:renewal_request, status: "pending") }
    let!(:submitted_req) { create(:renewal_request, status: "submitted") }
    let!(:completed_req) { create(:renewal_request, status: "completed") }

    it "returns pending requests" do
      expect(RenewalRequest.pending).to contain_exactly(pending_req)
    end

    it "returns submitted requests" do
      expect(RenewalRequest.submitted).to contain_exactly(submitted_req)
    end

    it "returns completed requests" do
      expect(RenewalRequest.completed).to contain_exactly(completed_req)
    end
  end
end
