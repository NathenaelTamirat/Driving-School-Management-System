class MeklitBatchResponseCheckJob < ApplicationJob
  queue_as :default

  def perform
    Rails.logger.info "MeklitBatchResponseCheckJob started at #{Time.current}"

    Batch.where(status: 'submitted').find_each do |batch|
      MeklitBatchExportJob.perform_later(batch.id)
    end

    Rails.logger.info "MeklitBatchResponseCheckJob completed"
  end
end
