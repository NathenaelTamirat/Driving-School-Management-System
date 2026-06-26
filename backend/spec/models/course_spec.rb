# frozen_string_literal: true

require 'rails_helper'

RSpec.describe Course, type: :model do
  describe 'validations' do
    subject { build(:course) }

    it { should validate_presence_of(:name) }
    it { should validate_presence_of(:course_code) }
    it { should validate_uniqueness_of(:course_code) }
    it { should validate_presence_of(:standard_price) }
    it { should validate_presence_of(:premium_price) }
    it { should validate_presence_of(:fast_track_price) }
    
    it { should validate_numericality_of(:standard_price).is_greater_than(0) }
    it { should validate_numericality_of(:premium_price).is_greater_than(0) }
    it { should validate_numericality_of(:fast_track_price).is_greater_than(0) }
  end

  describe 'factory' do
    it 'has a valid factory' do
      expect(build(:course)).to be_valid
    end
  end

  describe '#price_for_tier' do
    let(:course) { create(:course, standard_price: 8000, premium_price: 10000, fast_track_price: 13000) }

    it 'returns standard price for standard tier' do
      expect(course.price_for_tier('standard')).to eq(8000)
    end

    it 'returns premium price for premium tier' do
      expect(course.price_for_tier('premium')).to eq(10000)
    end

    it 'returns fast track price for fast_track tier' do
      expect(course.price_for_tier('fast_track')).to eq(13000)
    end

    it 'returns standard price for unknown tier' do
      expect(course.price_for_tier('unknown')).to eq(8000)
    end

    it 'returns standard price for nil tier' do
      expect(course.price_for_tier(nil)).to eq(8000)
    end
  end

  describe '#upgrade_discount' do
    let(:course) { create(:course, standard_price: 8000, premium_price: 10000, fast_track_price: 13000) }

    it 'returns 30% discount from standard to premium' do
      expect(course.upgrade_discount('standard', 'premium')).to eq(600) # 30% of 2000
    end

    it 'returns 30% discount from standard to fast_track' do
      expect(course.upgrade_discount('standard', 'fast_track')).to eq(1500) # 30% of 5000
    end

    it 'returns 30% discount from premium to fast_track' do
      expect(course.upgrade_discount('premium', 'fast_track')).to eq(900) # 30% of 3000
    end

    it 'returns 0 discount for same tier' do
      expect(course.upgrade_discount('standard', 'standard')).to eq(0)
    end

    it 'returns 0 discount for downgrade' do
      expect(course.upgrade_discount('premium', 'standard')).to eq(0)
    end
  end
end
