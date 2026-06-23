# frozen_string_literal: true

require 'rails_helper'

RSpec.describe ExamBooking, type: :model do
  let(:student) { create(:student) }
  let(:exam_booking) { build(:exam_booking, student: student) }

  describe 'associations' do
    it { should belong_to(:student) }
  end

  describe 'validations' do
    it { should validate_presence_of(:exam_type) }
    it { should validate_presence_of(:scheduled_date) }
    it { should validate_presence_of(:status) }

    it 'validates exam_type inclusion' do
      expect(exam_booking).to allow_value('theory').for(:exam_type)
      expect(exam_booking).to allow_value('practical').for(:exam_type)
      expect(exam_booking).not_to allow_value('written').for(:exam_type)
    end

    it 'validates status inclusion' do
      expect(exam_booking).to allow_value('scheduled').for(:status)
      expect(exam_booking).to allow_value('completed').for(:status)
      expect(exam_booking).to allow_value('cancelled').for(:status)
      expect(exam_booking).to allow_value('no_show').for(:status)
      expect(exam_booking).not_to allow_value('pending').for(:status)
    end

    it 'validates score range when present' do
      expect(exam_booking).to allow_value(50).for(:score)
      expect(exam_booking).to allow_value(0).for(:score)
      expect(exam_booking).to allow_value(100).for(:score)
      expect(exam_booking).not_to allow_value(-1).for(:score)
      expect(exam_booking).not_to allow_value(101).for(:score)
    end

    it 'validates scheduled_date is in future on create' do
      exam_booking.scheduled_date = 1.day.ago
      expect(exam_booking).not_to be_valid
      expect(exam_booking.errors[:scheduled_date]).to include('must be in the future')
    end

    it 'requires score when status is completed' do
      exam_booking.status = 'completed'
      exam_booking.score = nil
      expect(exam_booking).not_to be_valid
      expect(exam_booking.errors[:score]).to include('is required when exam is completed')
    end
  end

  describe 'scopes' do
    before do
      create(:exam_booking, student: student, status: 'scheduled', scheduled_date: 1.day.from_now)
      create(:exam_booking, student: student, status: 'completed', scheduled_date: 1.day.ago)
      create(:exam_booking, student: student, status: 'scheduled', scheduled_date: 1.day.ago)
    end

    it '.scheduled returns scheduled exams' do
      expect(ExamBooking.scheduled.count).to eq(1)
    end

    it '.completed returns completed exams' do
      expect(ExamBooking.completed.count).to eq(1)
    end

    it '.upcoming returns future exams' do
      expect(ExamBooking.upcoming.count).to eq(1)
    end

    it '.past returns past exams' do
      expect(ExamBooking.past.count).to eq(2)
    end
  end

  describe '#complete!' do
    it 'marks exam as completed with score' do
      exam_booking.save!
      exam_booking.complete!(85)
      expect(exam_booking.status).to eq('completed')
      expect(exam_booking.score).to eq(85)
      expect(exam_booking.completed_at).not_to be_nil
    end
  end

  describe '#cancel!' do
    it 'marks exam as cancelled' do
      exam_booking.save!
      exam_booking.cancel!
      expect(exam_booking.status).to eq('cancelled')
    end
  end

  describe '#mark_no_show!' do
    it 'marks exam as no_show' do
      exam_booking.save!
      exam_booking.mark_no_show!
      expect(exam_booking.status).to eq('no_show')
    end
  end
end
