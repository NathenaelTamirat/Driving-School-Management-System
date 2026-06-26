# frozen_string_literal: true

require "rails_helper"

RSpec.describe LicenseUpgrade, type: :model do
  describe "associations" do
    it { is_expected.to belong_to(:student) }
  end

  describe "validations" do
    it { is_expected.to validate_presence_of(:prior_license_key) }
    it { is_expected.to validate_presence_of(:license_origin) }
    it { is_expected.to validate_presence_of(:license_issue_date) }
    it { is_expected.to validate_presence_of(:target_category) }
    it { is_expected.to validate_presence_of(:status) }
    it { is_expected.to validate_inclusion_of(:status).in_array(LicenseUpgrade::STATUSES) }
  end

  describe "#license_age_years" do
    it "returns nil when license_issue_date is nil" do
      upgrade = build(:license_upgrade, license_issue_date: nil)
      expect(upgrade.license_age_years).to be_nil
    end

    it "calculates correct age for a 5-year-old license" do
      upgrade = build(:license_upgrade, license_issue_date: 5.years.ago.to_date)
      expect(upgrade.license_age_years).to eq(5)
    end
  end

  describe "#valid_license_age?" do
    it "returns true for license older than 3 years" do
      upgrade = build(:license_upgrade, license_issue_date: 5.years.ago.to_date)
      expect(upgrade.valid_license_age?).to be true
    end

    it "returns false for license less than 3 years" do
      upgrade = build(:license_upgrade, license_issue_date: 1.year.ago.to_date)
      expect(upgrade.valid_license_age?).to be false
    end
  end

  describe "#issued_in_addis_ababa?" do
    it "returns true for Addis Ababa" do
      upgrade = build(:license_upgrade, license_origin: "Addis Ababa")
      expect(upgrade.issued_in_addis_ababa?).to be true
    end

    it "returns false for other origins" do
      upgrade = build(:license_upgrade, license_origin: "Bahir Dar")
      expect(upgrade.issued_in_addis_ababa?).to be false
    end
  end

  describe "#eligible_for_upgrade?" do
    it "returns true when both conditions are met" do
      upgrade = build(:license_upgrade,
        license_origin: "Addis Ababa",
        license_issue_date: 5.years.ago.to_date)
      expect(upgrade.eligible_for_upgrade?).to be true
    end

    it "returns false when origin is not Addis Ababa" do
      upgrade = build(:license_upgrade,
        license_origin: "Gondar",
        license_issue_date: 5.years.ago.to_date)
      expect(upgrade.eligible_for_upgrade?).to be false
    end

    it "returns false when license age is less than 3 years" do
      upgrade = build(:license_upgrade,
        license_origin: "Addis Ababa",
        license_issue_date: 1.year.ago.to_date)
      expect(upgrade.eligible_for_upgrade?).to be false
    end
  end

  describe "#approve!" do
    let(:upgrade) { create(:license_upgrade, status: "pending") }

    it "approves the upgrade" do
      upgrade.approve!
      expect(upgrade.status).to eq("approved")
    end
  end

  describe "#reject!" do
    let(:upgrade) { create(:license_upgrade, status: "pending") }

    it "rejects the upgrade" do
      upgrade.reject!
      expect(upgrade.status).to eq("rejected")
    end
  end

  describe "scopes" do
    let!(:pending_upgrade) { create(:license_upgrade, status: "pending") }
    let!(:approved_upgrade) { create(:license_upgrade, status: "approved") }
    let!(:rejected_upgrade) { create(:license_upgrade, status: "rejected") }

    it "returns pending upgrades" do
      expect(LicenseUpgrade.pending).to contain_exactly(pending_upgrade)
    end

    it "returns approved upgrades" do
      expect(LicenseUpgrade.approved).to contain_exactly(approved_upgrade)
    end

    it "returns rejected upgrades" do
      expect(LicenseUpgrade.rejected).to contain_exactly(rejected_upgrade)
    end
  end
end
