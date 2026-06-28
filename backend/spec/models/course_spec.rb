# frozen_string_literal: true

require 'rails_helper'

RSpec.describe Course, type: :model do
  describe 'validations' do
    subject { build(:course) }

    it { should validate_presence_of(:course_name) }
    it { should validate_presence_of(:standard_fee) }

    it { should validate_numericality_of(:standard_fee).is_greater_than(0) }
  end

  describe 'factory' do
    it 'has a valid factory' do
      expect(build(:course)).to be_valid
    end
  end

  describe '#fee_for_tier' do
    let(:course) { create(:course, standard_fee: 8000, premium_fee: 10000, fast_track_fee: 13000) }

    it 'returns standard fee for standard tier' do
      expect(course.fee_for_tier('standard')).to eq(8000)
    end

    it 'returns premium fee for premium tier' do
      expect(course.fee_for_tier('premium')).to eq(10000)
    end

    it 'returns fast track fee for fast_track tier' do
      expect(course.fee_for_tier('fast_track')).to eq(13000)
    end

    it 'returns standard fee for unknown tier' do
      expect(course.fee_for_tier('unknown')).to eq(8000)
    end

    it 'returns standard fee for nil tier' do
      expect(course.fee_for_tier(nil)).to eq(8000)
    end
  end

  describe '#upgrade_fee' do
    let(:course) { create(:course, standard_fee: 8000, premium_fee: 10000, fast_track_fee: 13000) }

    it 'returns discounted fee from standard to premium' do
      expected = 10000 * (1 - 30 / 100.0)
      expect(course.upgrade_fee('premium')).to eq(expected)
    end

    it 'returns discounted fee from standard to fast_track' do
      expected = 13000 * (1 - 30 / 100.0)
      expect(course.upgrade_fee('fast_track')).to eq(expected)
    end

    it 'applies 30% discount for standard tier' do
      expected = 8000 * (1 - 30 / 100.0)
      expect(course.upgrade_fee('standard')).to eq(expected)
    end
  end
end
