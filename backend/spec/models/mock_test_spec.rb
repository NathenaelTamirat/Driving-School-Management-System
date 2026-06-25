require "rails_helper"

RSpec.describe MockTest, type: :model do
  let(:student) { create(:student) }

  describe "associations" do
    it { should belong_to(:student) }
  end

  describe "validations" do
    it "is invalid without a score" do
      test = build(:mock_test, student: student, score: nil)
      expect(test).not_to be_valid
    end

    it "is invalid with a score below 0" do
      test = build(:mock_test, student: student, score: -1)
      expect(test).not_to be_valid
    end

    it "is invalid with a score above 100" do
      test = build(:mock_test, student: student, score: 101)
      expect(test).not_to be_valid
    end

    it "is invalid without a test_date" do
      test = build(:mock_test, student: student, test_date: nil)
      expect(test).not_to be_valid
    end
  end

  describe "result assignment" do
    it "sets result to passed when score is above the threshold" do
      test = create(:mock_test, student: student, score: 38)
      expect(test.result).to eq("passed")
    end

    it "sets result to remedial when score is at or below the threshold" do
      test = create(:mock_test, student: student, score: 37)
      expect(test.result).to eq("remedial")
    end
  end

  describe "student score sync" do
    it "updates the student mock_test_score after save" do
      create(:mock_test, student: student, score: 75)
      expect(student.reload.mock_test_score).to eq(75)
    end

    it "overwrites a previous score with the latest" do
      create(:mock_test, student: student, score: 40, test_date: 2.days.ago.to_date)
      create(:mock_test, student: student, score: 80, test_date: Date.today)
      expect(student.reload.mock_test_score).to eq(80)
    end
  end

  describe "scopes" do
    before do
      create(:mock_test, student: student, score: 50, test_date: 2.days.ago.to_date)
      create(:mock_test, student: student, score: 20, test_date: 1.day.ago.to_date)
    end

    it ".passed returns only passing tests" do
      expect(MockTest.passed.count).to eq(1)
    end

    it ".remedial returns only failing tests" do
      expect(MockTest.remedial.count).to eq(1)
    end
  end
end
