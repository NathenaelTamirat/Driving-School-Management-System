# frozen_string_literal: true

require 'rails_helper'

RSpec.describe Finance::PricingService, type: :service do
  let(:course) { create(:course, standard_fee: 8000, premium_fee: 10000, fast_track_fee: 13000) }
  let(:batch) { create(:batch) }
  let(:student) { create(:student, batch: batch, course: course, pricing_tier: 'standard', status: 'registered') }

  describe '#calculate' do
    subject(:service) { described_class.new(student) }

    context 'with standard tier' do
      it 'calculates correct total fee' do
        result = service.calculate
        expect(result[:total_fee]).to eq(8000)
      end

      it 'splits payment 50-50' do
        result = service.calculate
        expect(result[:milestone_1]).to eq(4000)
        expect(result[:milestone_2]).to eq(4000)
      end

      it 'creates milestone 1 invoice' do
        expect { service.calculate }.to change(Invoice, :count).by(1)
      end

      it 'updates student financial fields' do
        service.calculate
        student.reload

        expect(student.pricing_tier).to eq('standard')
        expect(student.total_fee).to eq(8000)
      end

      it 'returns success result' do
        result = service.calculate
        expect(result[:success]).to be true
      end
    end

    context 'with premium tier' do
      before { student.update(pricing_tier: 'premium') }

      it 'calculates correct total fee' do
        result = service.calculate
        expect(result[:total_fee]).to eq(10000)
      end

      it 'splits payment 50-50' do
        result = service.calculate
        expect(result[:milestone_1]).to eq(5000)
        expect(result[:milestone_2]).to eq(5000)
      end
    end

    context 'with fast_track tier' do
      before { student.update(pricing_tier: 'fast_track') }

      it 'calculates correct total fee' do
        result = service.calculate
        expect(result[:total_fee]).to eq(13000)
      end

      it 'splits payment 50-50' do
        result = service.calculate
        expect(result[:milestone_1]).to eq(6500)
        expect(result[:milestone_2]).to eq(6500)
      end
    end

    context 'with upgrade discount' do
      let(:existing_student) do
        create(:student,
          batch: batch,
          course: course,
          pricing_tier: 'premium',
          total_fee: 8000
        )
      end

      before do
        create(:license_upgrade, student: existing_student, status: 'approved')
      end

      it 'applies 30% upgrade discount' do
        result = described_class.new(existing_student).calculate
        expected_discounted = (10000 * (1 - 30/100.0)).round(2)
        expect(result[:total_fee]).to eq(expected_discounted)
      end
    end

    context 'error handling' do
      it 'handles missing course gracefully' do
        student_no_course = create(:student, batch: batch, course: nil, pricing_tier: 'standard')
        service = described_class.new(student_no_course)
        result = service.calculate
        expect(result[:success]).to be false
        expect(result[:errors]).to include(match(/Course is required/))
      end
    end
  end
end
