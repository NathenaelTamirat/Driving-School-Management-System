# frozen_string_literal: true

require 'rails_helper'

RSpec.describe ERTA::EligibilityValidator, type: :service do
  let(:batch) { create(:batch) }
  let(:student) { create(:student, batch: batch) }

  describe '#call' do
    context 'when student is eligible' do
      it 'returns true' do
        student.update!(
          status: 'exam_eligible',
          theory_days_completed: 35,
          practical_days_completed: 52,
          mock_test_score: 80
        )
        validator = described_class.new(student)
        expect(validator.call).to be true
        expect(validator.errors).to be_empty
      end
    end

    context 'when student status is not exam_eligible' do
      it 'adds error for invalid status' do
        student.update!(status: 'registered')
        validator = described_class.new(student)
        expect(validator.call).to be false
        expect(validator.errors).to include(/not eligible for exam booking/)
      end
    end

    context 'when theory training is incomplete' do
      it 'adds error for insufficient theory days' do
        student.update!(
          status: 'exam_eligible',
          theory_days_completed: 30,
          practical_days_completed: 52,
          mock_test_score: 80
        )
        validator = described_class.new(student)
        expect(validator.call).to be false
        expect(validator.errors).to include(/Theory training incomplete/)
      end
    end

    context 'when practical training is incomplete' do
      it 'adds error for insufficient practical days' do
        student.update!(
          status: 'exam_eligible',
          theory_days_completed: 35,
          practical_days_completed: 45,
          mock_test_score: 80
        )
        validator = described_class.new(student)
        expect(validator.call).to be false
        expect(validator.errors).to include(/Practical training incomplete/)
      end
    end

    context 'when mock test score is insufficient' do
      it 'adds error for low mock test score' do
        student.update!(
          status: 'exam_eligible',
          theory_days_completed: 35,
          practical_days_completed: 52,
          mock_test_score: 35
        )
        validator = described_class.new(student)
        expect(validator.call).to be false
        expect(validator.errors).to include(/Mock test score insufficient/)
      end
    end

    context 'when multiple validation errors exist' do
      it 'collects all errors' do
        student.update!(
          status: 'registered',
          theory_days_completed: 20,
          practical_days_completed: 30,
          mock_test_score: 30
        )
        validator = described_class.new(student)
        expect(validator.call).to be false
        expect(validator.errors.count).to be > 1
      end
    end
  end
end
