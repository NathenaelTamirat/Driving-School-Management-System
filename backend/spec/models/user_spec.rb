# frozen_string_literal: true

require "rails_helper"

RSpec.describe User, type: :model do
  it "is valid with valid attributes" do
    expect(build(:user)).to be_valid
  end

  it "requires a full_name" do
    expect(build(:user, full_name: nil)).not_to be_valid
  end

  it "rejects an unknown role" do
    expect(build(:user, role: "wizard")).not_to be_valid
  end

  it "requires a unique email" do
    create(:user, email: "dupe@example.com")
    expect(build(:user, email: "dupe@example.com")).not_to be_valid
  end

  it "requires a license number for instructors" do
    expect(build(:user, :instructor, instructor_license_number: nil)).not_to be_valid
  end

  it "does not require a license number for non-instructors" do
    expect(build(:user, role: "clerk")).to be_valid
  end

  describe "role predicates" do
    it { expect(build(:user, :admin)).to be_admin }
    it { expect(build(:user, :instructor)).to be_instructor }
    it { expect(build(:user, :clerk)).to be_clerk }
    it { expect(build(:user)).to be_student }
  end
end
