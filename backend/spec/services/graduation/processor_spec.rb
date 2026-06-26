require "rails_helper"

RSpec.describe Graduation::Processor, type: :service do
  let(:student) { create(:student, status: "exam_eligible") }
  let!(:passed_booking) do
    create(:exam_booking,
           student:        student,
           exam_type:      "practical",
           status:         "completed",
           score:          60,
           scheduled_date: 1.week.ago,
           completed_at:   1.week.ago)
  end

  subject(:processor) { described_class.new(student) }

  describe "#call — happy path" do
    before { allow(DossierTransferJob).to receive(:perform_later) }

    it "returns true" do
      expect(processor.call).to be true
    end

    it "transitions student to graduated" do
      processor.call
      expect(student.reload.status).to eq("graduated")
    end

    it "creates a GraduationRecord" do
      expect { processor.call }.to change(GraduationRecord, :count).by(1)
    end

    it "sets dossier_status to compiling" do
      processor.call
      expect(student.graduation_record.dossier_status).to eq("compiling")
    end

    it "enqueues DossierTransferJob" do
      processor.call
      expect(DossierTransferJob).to have_received(:perform_later).with(student.id)
    end
  end

  describe "#call — failure cases" do
    it "returns false when student is not exam_eligible" do
      student.update!(status: "practical_in_progress")
      expect(processor.call).to be false
      expect(processor.errors).not_to be_empty
    end

    it "returns false when no passed practical exam exists" do
      passed_booking.destroy
      expect(processor.call).to be false
      expect(processor.errors).to include("No passed practical exam found")
    end

    it "does not change student status on failure" do
      student.update!(status: "practical_in_progress")
      processor.call
      expect(student.reload.status).to eq("practical_in_progress")
    end

    it "does not create a GraduationRecord on failure" do
      student.update!(status: "practical_in_progress")
      expect { processor.call }.not_to change(GraduationRecord, :count)
    end
  end
end
