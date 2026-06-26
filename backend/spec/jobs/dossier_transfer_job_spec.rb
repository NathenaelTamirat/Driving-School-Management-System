require "rails_helper"

RSpec.describe DossierTransferJob, type: :job do
  let(:student) { create(:student, status: "graduated") }
  let!(:record) { create(:graduation_record, student: student, dossier_status: "compiling") }

  it "updates dossier_status to transferred" do
    described_class.perform_now(student.id)
    expect(record.reload.dossier_status).to eq("transferred")
  end

  it "is idempotent — does not change status if already transferred" do
    record.update!(dossier_status: "transferred")
    described_class.perform_now(student.id)
    expect(record.reload.dossier_status).to eq("transferred")
  end

  it "does not raise when student is not found" do
    expect { described_class.perform_now(0) }.not_to raise_error
  end
end
