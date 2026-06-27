# frozen_string_literal: true

require 'rails_helper'

RSpec.describe Finance::PricingService, type: :service do
  let(:course) { create(:course, standard_price: 8000, premium_price: 10000, fast_track_price: 13000) }
  let(:batch) { create(:batch) }
  let(:student) { build(:student, batch: batch, status: 'registered') }

  describe '#calculate_and_create_invoice' do
    context 'with standard tier' do
      subject(:service) { described_class.new(student, course, 'standard') }

      it 'calculates correct total fee' do
        result = service.calculate_and_create_invoice
        expect(result[:total_fee]).to eq(8000)
      end

      it 'splits payment 50-50' do
        result = service.calculate_and_create_invoice
        expect(result[:milestone_1_amount]).to eq(4000)
        expect(result[:milestone_2_amount]).to eq(4000)
      end

      it 'creates milestone 1 invoice' do
        expect { service.calculate_and_create_invoice }.to change(Invoice, :count).by(1)
      end

      it 'updates student financial fields' do
        student.save!
        service.calculate_and_create_invoice
        student.reload
        
        expect(student.pricing_tier).to eq('standard')
        expect(student.total_fee).to eq(8000)
      end

      it 'returns success result' do
        result = service.calculate_and_create_invoice
        expect(result[:success]).to be true
        expect(result[:invoice]).to be_a(Invoice)
      end
    end

    context 'with premium tier' do
      subject(:service) { described_class.new(student, course, 'premium') }

      it 'calculates correct total fee' do
        result = service.calculate_and_create_invoice
        expect(result[:total_fee]).to eq(10000)
      end

      it 'splits payment 50-50' do
        result = service.calculate_and_create_invoice
        expect(result[:milestone_1_amount]).to eq(5000)
        expect(result[:milestone_2_amount]).to eq(5000)
      end
    end

    context 'with fast_track tier' do
      subject(:service) { described_class.new(student, course, 'fast_track') }

      it 'calculates correct total fee' do
        result = service.calculate_and_create_invoice
        expect(result[:total_fee]).to eq(13000)
      end

      it 'splits payment 50-50' do
        result = service.calculate_and_create_invoice
        expect(result[:milestone_1_amount]).to eq(6500)
        expect(result[:milestone_2_amount]).to eq(6500)
      end
    end

    context 'with upgrade discount' do
      let(:existing_student) do
        create(:student, 
          batch: batch,
          pricing_tier: 'standard',
          total_fee: 8000,
          amount_paid: 8000
        )
      end

      subject(:service) { described_class.new(existing_student, course, 'premium') }

      it 'applies 30% upgrade discount' do
        result = service.calculate_and_create_invoice
        # Premium (10000) - Standard (8000) = 2000 difference
        # 30% discount on 2000 = 600 discount
        # Total: 10000 - 600 = 9400
        expect(result[:total_fee]).to eq(9400)
      end

      it 'includes discount in result' do
        result = service.calculate_and_create_invoice
        expect(result[:upgrade_discount]).to eq(600)
      end
    end

    context 'error handling' do
      it 'handles invalid tier gracefully' do
        service = described_class.new(student, course, 'invalid')
        result = service.calculate_and_create_invoice
        expect(result[:success]).to be true # Falls back to standard
        expect(result[:total_fee]).to eq(8000)
      end
    end
  end
end
