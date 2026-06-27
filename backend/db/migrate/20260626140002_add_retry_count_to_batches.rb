# frozen_string_literal: true

class AddRetryCountToBatches < ActiveRecord::Migration[8.1]
  def change
    add_column :batches, :retry_count, :integer, default: 0, null: false
  end
end
