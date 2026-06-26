# frozen_string_literal: true

require "rails_helper"

RSpec.describe Invoice, type: :model do
  describe "associations" do
    it { is_expected.to belong_to(:student) }
  end

  describe "validations" do
    it { is_expected.to validate_presence_of(:amount) }
    it { is_expected.to validate_presence_of(:milestone_type) }
    it { is_expected.to validate_presence_of(:status) }
    it { is_expected.to validate_numericality_of(:amount).is_greater_than(0) }
    it { is_expected.to validate_inclusion_of(:milestone_type).in_array(Invoice::MILESTONE_TYPES.values) }
    it { is_expected.to validate_inclusion_of(:status).in_array(Invoice::STATUSES) }
  end

  describe "scopes" do
    let!(:pending_invoice) { create(:invoice, status: "pending") }
    let!(:paid_invoice) { create(:invoice, status: "paid") }
    let!(:overdue_invoice) { create(:invoice, status: "overdue") }

    it "returns pending invoices" do
      expect(Invoice.pending).to contain_exactly(pending_invoice)
    end

    it "returns paid invoices" do
      expect(Invoice.paid).to contain_exactly(paid_invoice)
    end

    it "returns overdue invoices" do
      expect(Invoice.overdue).to contain_exactly(overdue_invoice)
    end
  end

  describe "#mark_as_paid!" do
    let(:invoice) { create(:invoice, status: "pending") }

    it "marks invoice as paid" do
      freeze_time do
        invoice.mark_as_paid!
        expect(invoice).to be_paid
        expect(invoice.paid_at).to eq(Time.current)
      end
    end
  end

  describe "#mark_as_overdue!" do
    let(:invoice) { create(:invoice, status: "pending") }

    it "marks invoice as overdue" do
      invoice.mark_as_overdue!
      expect(invoice).to be_overdue
    end
  end

  describe "#cancel!" do
    let(:invoice) { create(:invoice, status: "pending") }

    it "cancels the invoice" do
      invoice.cancel!
      expect(invoice.status).to eq("cancelled")
    end
  end
end
