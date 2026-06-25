require "rails_helper"

RSpec.describe Lms::AttendanceRecorder, type: :service do
  let(:batch)   { create(:batch) }
  let(:student) { create(:student, batch: batch, status: "registered") }

  let(:valid_params) do
    {
      phase:             "theory",
      attendance_date:   Date.today,
      present:           true,
      instructor_name:   "Abebe Kebede",
      digital_signature: "SIG-ABCDEF",
      notes:             nil
    }
  end

  describe "#call — happy path" do
    it "returns true on success" do
      expect(described_class.new(student, valid_params).call).to be true
    end

    it "creates an AttendanceLog record" do
      expect { described_class.new(student, valid_params).call }
        .to change(AttendanceLog, :count).by(1)
    end

    it "increments theory_days_completed when phase is theory and student is present" do
      expect { described_class.new(student, valid_params).call }
        .to change { student.reload.theory_days_completed }.by(1)
    end

    it "increments practical_days_completed when phase is practical" do
      student.update!(status: "practical_in_progress")
      params = valid_params.merge(phase: "practical", attendance_date: Date.today - 1)
      expect { described_class.new(student, params).call }
        .to change { student.reload.practical_days_completed }.by(1)
    end

    it "does not increment counter when student is absent" do
      absent_params = valid_params.merge(present: false)
      expect { described_class.new(student, absent_params).call }
        .not_to change { student.reload.theory_days_completed }
    end

    it "updates last_attendance_date" do
      described_class.new(student, valid_params).call
      expect(student.reload.last_attendance_date).to eq(Date.today)
    end

    it "transitions student from registered to theory_in_progress on first present log" do
      described_class.new(student, valid_params).call
      expect(student.reload.status).to eq("theory_in_progress")
    end
  end

  describe "#call — AASM transitions" do
    it "transitions to practical_in_progress when theory threshold and mock score are met" do
      student.update!(
        status:                 "theory_in_progress",
        theory_days_completed:  34,
        mock_test_score:        50
      )
      described_class.new(student, valid_params.merge(attendance_date: Date.today - 1)).call
      expect(student.reload.status).to eq("practical_in_progress")
    end

    it "does not transition to practical_in_progress if mock score is too low" do
      student.update!(
        status:                "theory_in_progress",
        theory_days_completed: 34,
        mock_test_score:       30
      )
      described_class.new(student, valid_params.merge(attendance_date: Date.today - 1)).call
      expect(student.reload.status).to eq("theory_in_progress")
    end

    it "transitions to exam_eligible when practical threshold is met" do
      student.update!(
        status:                      "practical_in_progress",
        practical_days_completed:    51
      )
      params = valid_params.merge(phase: "practical", attendance_date: Date.today - 1)
      described_class.new(student, params).call
      expect(student.reload.status).to eq("exam_eligible")
    end
  end

  describe "#call — failure cases" do
    it "returns false and populates errors on duplicate log" do
      described_class.new(student, valid_params).call
      recorder = described_class.new(student, valid_params)
      expect(recorder.call).to be false
      expect(recorder.errors).not_to be_empty
    end

    it "returns false and populates errors when phase is invalid" do
      recorder = described_class.new(student, valid_params.merge(phase: "swimming"))
      expect(recorder.call).to be false
      expect(recorder.errors).not_to be_empty
    end

    it "does not increment counter when log creation fails" do
      invalid_params = valid_params.merge(phase: nil)
      expect { described_class.new(student, invalid_params).call }
        .not_to change { student.reload.theory_days_completed }
    end
  end
end
