require 'rails_helper'

RSpec.describe MeklitBatchResponseCheckJob, type: :job do
  describe '#perform' do
    let!(:submitted_batch) { create(:batch, status: 'submitted') }
    let!(:pending_batch) { create(:batch, status: 'submitted') }
    let!(:approved_batch) { create(:batch, status: 'approved') }
    let!(:rejected_batch) { create(:batch, status: 'rejected') }

    it 'enqueues MeklitBatchExportJob for each submitted/pending batch' do
      expect {
        described_class.perform_now
      }.to have_enqueued_job(MeklitBatchExportJob).twice
    end

    it 'does not enqueue for already processed batches' do
      expect {
        described_class.perform_now
      }.not_to have_enqueued_job(MeklitBatchExportJob).with(approved_batch.id)
    end

    it 'enqueues with correct batch IDs' do
      described_class.perform_now
      expect(MeklitBatchExportJob).to have_been_enqueued.with(submitted_batch.id)
      expect(MeklitBatchExportJob).to have_been_enqueued.with(pending_batch.id)
    end

    it 'logs start and completion' do
      expect(Rails.logger).to receive(:info).at_least(:twice)
      described_class.perform_now
    end
  end
end
