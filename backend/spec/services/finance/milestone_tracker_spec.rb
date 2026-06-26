# frozen_string_literal: true

require 'rails_helper'

RSpec.describe Finance::MilestoneTracker, type: :service do
  let(:batch) { create(:batch) }
  let(:student) do
    create(:student,
      batch: batch,
      status: 'practical_in_progress',
      theory_days_completed: 35,
      practical_days_completed: 10,
      mock_test_score: 45,
      pricing_tier: 'standard',
      total_fee: 8000,
      milestone_1_paid: true
    )
  end

  describe '#generate_milestone_2_invoice' do
    subject(:tracker) { described_class.new(student) }

    context 'when eligible' do
      it 'creates milestone 2 invoice' do
        expect { tracker.generate_milestone_2_invoice }.to change(Invoice, :count).by(1)
      end

      it 'creates invoice with correct amount' do
        result = tracker.generate_milestone_2_invoice
        expect(result[:invoice].amount).to eq(4000) # 50% of 8000
      end

      it 'creates invoice with correct type' do
        result = tracker.generate_milestone_2_invoice
        expect(result[:invoice].milestone_type).to include('Practical')
      end

      it 'sets invoice status to pending' do
        result = tracker.generate_milestone_2_invoice
        expect(result[:invoice].status).to eq('pending')
      end

      it 'returns success result' do
        result = tracker.generate_milestone_2_invoice
        expect(result[:success]).to be true
      end
    end

    context 'when not eligible' do
      context 'wrong status' do
        before { student.update(status: 'registered') }

        it 'does not create invoice' do
          expect { tracker.generate_milestone_2_invoice }.not_to change(Invoice, :count)
        end

        it 'returns error' do
          result = tracker.generate_milestone_2_invoice
          expect(result[:success]).to be false
          expect(result[:errors]).to include(match(/practical_in_progress/))
        end
      end

      context 'low mock test score' do
        before { student.update(mock_test_score: 30) }

        it 'does not create invoice' do
          expect { tracker.generate_milestone_2_invoice }.not_to change(Invoice, :count)
        end

        it 'returns error' do
          result = tracker.generate_milestone_2_invoice
          expect(result[:success]).to be false
          expect(result[:errors]).to include(match(/Mock test score/))
        end
      end

      context 'milestone 1 not paid' do
        before { student.update(milestone_1_paid: false) }

        it 'does not create invoice' do
          expect { tracker.generate_milestone_2_invoice }.not_to change(Invoice, :count)
        end

        it 'returns error' do
          result = tracker.generate_milestone_2_invoice
          expect(result[:success]).to be false
          expect(result[:errors]).to include(match(/Milestone 1/))
        end
      end
    end

    context 'idempotency' do
      it 'does not create duplicate invoices' do
        tracker.generate_milestone_2_invoice
        expect { tracker.generate_milestone_2_invoice }.not_to change(Invoice, :count)
      end

      it 'returns error on duplicate attempt' do
        tracker.generate_milestone_2_invoice
        result = tracker.generate_milestone_2_invoice
        expect(result[:success]).to be false
        expect(result[:errors]).to include(match(/already exists/))
      end
    end
  end

  describe '#milestone_2_eligible?' do
    subject(:tracker) { described_class.new(student) }

    it 'returns true when all conditions met' do
      expect(tracker.milestone_2_eligible?).to be true
    end

    it 'returns false when status wrong' do
      student.update(status: 'registered')
      expect(tracker.milestone_2_eligible?).to be false
    end

    it 'returns false when mock test score low' do
      student.update(mock_test_score: 30)
      expect(tracker.milestone_2_eligible?).to be false
    end

    it 'returns false when milestone 1 not paid' do
      student.update(milestone_1_paid: false)
      expect(tracker.milestone_2_eligible?).to be false
    end
  end
end
