require 'rails_helper'

RSpec.describe Student, type: :model do
  let(:batch) { create(:batch) }
  let(:student) { create(:student, batch: batch) }

  describe 'associations' do
    it { should belong_to(:batch) }
    it { should have_many(:exam_bookings).dependent(:destroy) }
  end

  describe '#exam_eligible?' do
    it 'returns true when status is exam_eligible' do
      student.update!(status: 'exam_eligible')
      expect(student.exam_eligible?).to be true
    end

    it 'returns false when status is not exam_eligible' do
      student.update!(status: 'registered')
      expect(student.exam_eligible?).to be false
    end
  end

  describe '#under_penalty_active?' do
    it 'returns true when student is under active penalty' do
      student.update!(under_penalty: true, penalty_end_date: 7.days.from_now)
      expect(student.under_penalty_active?).to be true
    end

    it 'returns false when penalty has expired' do
      student.update!(under_penalty: true, penalty_end_date: 1.day.ago)
      expect(student.under_penalty_active?).to be false
    end

    it 'returns false when student is not under penalty' do
      student.update!(under_penalty: false)
      expect(student.under_penalty_active?).to be false
    end

    it 'returns false when penalty_end_date is nil' do
      student.update!(under_penalty: true, penalty_end_date: nil)
      expect(student.under_penalty_active?).to be false
    end
  end
end
