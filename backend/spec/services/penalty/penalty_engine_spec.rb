# frozen_string_literal: true

require 'rails_helper'

RSpec.describe Penalty::PenaltyEngine, type: :service do
  let(:batch) { create(:batch) }
  let(:student) { create(:student, batch: batch) }
  let(:exam_booking) { create(:exam_booking, student: student, status: 'completed', score: 30) }

  describe '#apply_failure_penalty' do
    context 'when exam was failed' do
      it 'applies penalty to student' do
        engine = described_class.new(student, exam_booking)
        expect(engine.apply_failure_penalty).to be true
        expect(student.reload.under_penalty).to be true
        expect(student.penalty_end_date).not_to be_nil
      end

      it 'sets penalty reason' do
        engine = described_class.new(student, exam_booking)
        engine.apply_failure_penalty
        expect(student.reload.penalty_reason).to include('Failed')
      end
    end

    context 'when exam was passed' do
      it 'does not apply penalty' do
        exam_booking.update!(score: 80)
        engine = described_class.new(student, exam_booking)
        expect(engine.apply_failure_penalty).to be false
        expect(student.reload.under_penalty).to be false
      end
    end

    context 'when exam is not completed' do
      it 'does not apply penalty' do
        exam_booking.update!(status: 'scheduled')
        engine = described_class.new(student, exam_booking)
        expect(engine.apply_failure_penalty).to be false
      end
    end
  end

  describe '.under_penalty?' do
    it 'returns true when student is under active penalty' do
      student.update!(under_penalty: true, penalty_end_date: 7.days.from_now)
      expect(described_class.under_penalty?(student)).to be true
    end

    it 'returns false when penalty has expired' do
      student.update!(under_penalty: true, penalty_end_date: 1.day.ago)
      expect(described_class.under_penalty?(student)).to be false
    end

    it 'returns false when student is not under penalty' do
      student.update!(under_penalty: false)
      expect(described_class.under_penalty?(student)).to be false
    end
  end

  describe '.clear_penalty' do
    it 'clears penalty from student' do
      student.update!(under_penalty: true, penalty_end_date: 7.days.from_now, penalty_reason: 'Test')
      described_class.clear_penalty(student)
      expect(student.reload.under_penalty).to be false
      expect(student.penalty_end_date).to be_nil
      expect(student.penalty_reason).to be_nil
    end
  end
end
