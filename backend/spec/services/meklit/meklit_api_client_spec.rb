# frozen_string_literal: true

require 'rails_helper'

RSpec.describe Meklit::MeklitApiClient, type: :service do
  let(:client) { described_class.new(logger: Rails.logger) }
  let(:payload) { { batch: { id: 1, name: 'Test Batch' } } }

  # The test fallback URL is set in MeklitApiClient#base_url when
  # MEKLIT_API_BASE_URL is not set and Rails.env.test? is true.
  let(:test_base) { 'http://localhost:9999' }

  describe '#submit_batch' do
    it 'submits batch payload to API' do
      stub_request(:post, "#{test_base}/api/v1/batches")
        .with(headers: { 'Content-Type' => 'application/json' })
        .to_return(status: 200, body: { success: true }.to_json)

      response = client.submit_batch(payload)
      expect(response[:success]).to be true
    end

    it 'handles API errors' do
      stub_request(:post, "#{test_base}/api/v1/batches")
        .to_return(status: 500, body: { error: 'Server error' }.to_json)

      response = client.submit_batch(payload)
      expect(response[:success]).to be false
      expect(response[:error]).to include('Server error')
    end
  end

  describe '#check_batch_status' do
    it 'retrieves batch status from API' do
      stub_request(:get, "#{test_base}/api/v1/batches/1/status")
        .to_return(status: 200, body: { status: 'processing' }.to_json)

      response = client.check_batch_status(1)
      expect(response[:success]).to be true
    end
  end

  describe '#get_batch_response' do
    it 'retrieves batch response from API' do
      stub_request(:get, "#{test_base}/api/v1/batches/1/response")
        .to_return(status: 200, body: { status: 'approved' }.to_json)

      response = client.get_batch_response(1)
      expect(response[:success]).to be true
    end
  end
end
