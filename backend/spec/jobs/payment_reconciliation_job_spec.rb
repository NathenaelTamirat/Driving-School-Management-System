# frozen_string_literal: true

require 'rails_helper'

RSpec.describe PaymentReconciliationJob, type: :job do
  describe '#perform' do
    let(:batch) { create(:batch) }
    let!(:student1) { create(:student, batch: batch, total_fee: 8000, amount_paid: 8000) }
    let!(:student2) { create(:student, batch: batch, total_fee: 10000, amount_paid: 9000) }

    it 'calls PaymentReconciliation service' do
      expect(Finance::PaymentReconciliation).to receive(:new).and_call_original
      described_class.perform_now
    end

    it 'reconciles all students' do
      service_double = instance_double(Finance::PaymentReconciliation)
      allow(Finance::PaymentReconciliation).to receive(:new).and_return(service_double)
      allow(service_double).to receive(:reconcile_all).and_return({ total_students_checked: 2 })
      allow(service_double).to receive(:generate_report).and_return({ summary: { discrepancies_found: 0 } })

      described_class.perform_now
      
      expect(service_double).to have_received(:reconcile_all)
      expect(service_double).to have_received(:generate_report)
    end

    it 'logs results' do
      expect(Rails.logger).to receive(:info).with(/PaymentReconciliationJob started/)
      expect(Rails.logger).to receive(:info).with(/Students checked/)
      expect(Rails.logger).to receive(:info).with(/PaymentReconciliationJob completed/)
      
      described_class.perform_now
    end

    context 'with specific date' do
      it 'uses provided date' do
        test_date = Date.new(2024, 1, 15)
        
        expect(Finance::PaymentReconciliation).to receive(:new)
          .with(start_date: test_date, end_date: test_date)
          .and_call_original
        
        described_class.perform_now(date: test_date)
      end
    end

    context 'error handling' do
      it 're-raises errors for retry mechanism' do
        allow(Finance::PaymentReconciliation).to receive(:new).and_raise(StandardError, 'Test error')
        
        expect {
          described_class.perform_now
        }.to raise_error(StandardError, 'Test error')
      end

      it 'logs errors' do
        allow(Finance::PaymentReconciliation).to receive(:new).and_raise(StandardError, 'Test error')
        
        expect(Rails.logger).to receive(:error).with(/PaymentReconciliationJob failed/)
        expect(Rails.logger).to receive(:error).with(/Test error/)
        
        begin
          described_class.perform_now
        rescue StandardError
          # Expected
        end
      end
    end
  end
end
