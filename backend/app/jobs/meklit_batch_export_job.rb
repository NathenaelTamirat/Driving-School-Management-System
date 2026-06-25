# frozen_string_literal: true

class MeklitBatchExportJob < ApplicationJob
  queue_as :default

  # Check for ERTA response for a submitted batch
  # This job polls the ERTA API to check if the batch has been approved or rejected
  def perform(batch_id)
    batch = Batch.find(batch_id)
    logger.info "[MeklitBatchExportJob] Checking response for batch #{batch_id}"

    # Skip if batch is already processed
    return if batch.approved? || batch.rejected?

    # Check batch status from ERTA API
    api_client = Meklit::MeklitApiClient.new
    response = api_client.get_batch_response(batch_id)

    unless response[:success]
      logger.warn "[MeklitBatchExportJob] Failed to get response: #{response[:error]}"
      schedule_retry(batch_id)
      return
    end

    # Process the response
    response_handler = Meklit::ResponseHandler.new(batch, response[:data])
    if response_handler.call
      logger.info "[MeklitBatchExportJob] Batch #{batch_id} response processed successfully"
    else
      logger.error "[MeklitBatchExportJob] Failed to process response for batch #{batch_id}"
      schedule_retry(batch_id)
    end
  rescue ActiveRecord::RecordNotFound => e
    logger.error "[MeklitBatchExportJob] Batch #{batch_id} not found: #{e.message}"
  rescue StandardError => e
    logger.error "[MeklitBatchExportJob] Error processing batch #{batch_id}: #{e.message}"
    logger.error e.backtrace.join("\n")
    schedule_retry(batch_id)
  end

  private

  # Schedule a retry with exponential backoff
  def schedule_retry(batch_id)
    # Retry with exponential backoff: 5min, 10min, 20min, 40min, then stop
    retry_count = Redis.current.incr("meklit_retry:#{batch_id}") rescue 1
    max_retries = 5

    return if retry_count > max_retries

    delay = [ 5 * (2 ** (retry_count - 1)), 60 ].min # Max 60 minutes
    logger.info "[MeklitBatchExportJob] Scheduling retry #{retry_count}/#{max_retries} in #{delay} minutes"

    MeklitBatchExportJob.set(wait: delay.minutes).perform_later(batch_id)
  end
end
