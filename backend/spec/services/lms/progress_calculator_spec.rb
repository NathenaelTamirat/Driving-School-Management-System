require "rails_helper"

RSpec.describe Lms::ProgressCalculator, type: :service do
  let(:student) { create(:student) }

  subject(:result) { described_class.new(student).call }

  it "returns a hash with the expected keys" do
    expect(result.keys).to match_array(%i[status theory practical mock_test next_milestone exam_eligible])
  end

  describe "theory progress" do
    it "calculates percentage correctly" do
      student.update!(theory_days_completed: 17)
      expect(result[:theory][:percentage]).to eq(48.6)
    end

    it "caps percentage at 100 when days exceed required" do
      student.update!(theory_days_completed: 40)
      expect(result[:theory][:percentage]).to eq(100)
    end

    it "marks theory complete when days_completed >= 35" do
      student.update!(theory_days_completed: 35)
      expect(result[:theory][:complete]).to be true
    end
  end

  describe "mock test progress" do
    it "marks mock test as passed when score is above threshold" do
      student.update!(mock_test_score: 50)
      expect(result[:mock_test][:passed]).to be true
    end

    it "marks mock test as not passed when score is at or below threshold" do
      student.update!(mock_test_score: 37)
      expect(result[:mock_test][:passed]).to be false
    end
  end

  describe "next_milestone" do
    it "returns the correct message for each status" do
      student.update!(status: "registered")
      expect(result[:next_milestone]).to include("theory attendance")

      student.update!(status: "theory_in_progress")
      expect(result[:next_milestone]).to include("35 theory days")

      student.update!(status: "practical_in_progress")
      expect(result[:next_milestone]).to include("52 practical days")

      student.update!(status: "exam_eligible")
      expect(result[:next_milestone]).to include("ERTA exam")
    end
  end
end
