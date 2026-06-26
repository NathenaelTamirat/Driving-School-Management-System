require "rails_helper"

RSpec.describe Graduation::EligibilityValidator, type: :service do
  let(:student) { create(:student, status: "exam_eligible") }
  # ExamBooking validates scheduled_date is in the future on :create, so create
  # with the factory's future date, then mark it completed via update_columns
  # (bypasses validations) to simulate a finished, passed practical exam.
  let(:passed_booking) do
    create(:exam_booking, student: student, exam_type: "practical").tap do |booking|
      booking.update_columns(status: "completed", score: 60, completed_at: 1.week.ago)
    end
  end

  before { passed_booking }

  subject(:valid?) { described_class.new(student).call }

  describe "happy path" do
    it "returns true when all conditions are met" do
      expect(valid?).to be true
    end
  end

  describe "validate_status" do
    it "fails when student is not exam_eligible" do
      student.update!(status: "practical_in_progress")
      expect(valid?).to be false
      expect(described_class.new(student).tap(&:call).errors).to include(match(/not eligible/))
    end
  end

  describe "validate_passed_practical_exam" do
    it "fails when no practical exam exists" do
      passed_booking.destroy
      validator = described_class.new(student)
      expect(validator.call).to be false
      expect(validator.errors).to include("No passed practical exam found")
    end

    it "fails when practical exam exists but was not passed" do
      passed_booking.update!(score: 20)
      validator = described_class.new(student)
      expect(validator.call).to be false
      expect(validator.errors).to include("No passed practical exam found")
    end
  end

  describe "validate_no_active_penalty" do
    it "fails when student is under active penalty" do
      student.update!(under_penalty: true, penalty_end_date: 5.days.from_now)
      validator = described_class.new(student)
      expect(validator.call).to be false
      expect(validator.errors.first).to include("active penalty")
    end

    it "passes when penalty has expired" do
      student.update!(under_penalty: true, penalty_end_date: 1.day.ago)
      expect(valid?).to be true
    end
  end
end
