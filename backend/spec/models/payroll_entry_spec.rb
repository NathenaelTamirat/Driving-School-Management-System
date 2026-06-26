# frozen_string_literal: true

require "rails_helper"

RSpec.describe PayrollEntry, type: :model do
  describe "associations" do
    it { is_expected.to belong_to(:user) }
  end

  describe "validations" do
    it { is_expected.to validate_presence_of(:base_pay) }
    it { is_expected.to validate_presence_of(:active_student_loads) }
    it { is_expected.to validate_presence_of(:active_training_days) }
    it { is_expected.to validate_presence_of(:total_pay) }
    it { is_expected.to validate_presence_of(:period_start) }
    it { is_expected.to validate_presence_of(:period_end) }
    it { is_expected.to validate_presence_of(:status) }
    it { is_expected.to validate_inclusion_of(:status).in_array(PayrollEntry::STATUSES) }
  end

  describe "scopes" do
    let!(:draft_entry) { create(:payroll_entry, status: "draft") }
    let!(:paid_entry) { create(:payroll_entry, status: "paid") }

    it "returns draft entries" do
      expect(PayrollEntry.draft).to contain_exactly(draft_entry)
    end

    it "returns paid entries" do
      expect(PayrollEntry.paid).to contain_exactly(paid_entry)
    end
  end

  describe "#mark_as_paid!" do
    let(:entry) { create(:payroll_entry, status: "draft") }

    it "marks entry as paid" do
      freeze_time do
        entry.mark_as_paid!
        expect(entry).to be_paid
        expect(entry.paid_at).to eq(Time.current)
      end
    end
  end

  describe "#cancel!" do
    let(:entry) { create(:payroll_entry, status: "draft") }

    it "cancels the entry" do
      entry.cancel!
      expect(entry.status).to eq("cancelled")
    end
  end
end
