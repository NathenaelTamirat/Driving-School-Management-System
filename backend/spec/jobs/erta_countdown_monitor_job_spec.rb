require "rails_helper"

RSpec.describe ERTACountdownMonitorJob, type: :job do
  describe "#perform" do
    let!(:student_approaching) do
      create(:student, status: "theory_in_progress",
             meklit_approval_date: 32.days.ago,
             student_id: "APP001", document_id: "DOC001")
    end

    let!(:student_past) do
      create(:student, status: "practical_in_progress",
             meklit_approval_date: 60.days.ago,
             student_id: "PAS001", document_id: "DOC002")
    end

    let!(:student_without_meklit) do
      create(:student, status: "theory_in_progress",
             meklit_approval_date: nil,
             student_id: "NOM001", document_id: "DOC003")
    end

    it "checks students and logs approaching/past deadlines" do
      expect(Rails.logger).to receive(:info).at_least(:once)
      described_class.perform_now
    end
  end
end
