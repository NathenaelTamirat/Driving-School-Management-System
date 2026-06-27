# frozen_string_literal: true

class CreateMockTests < ActiveRecord::Migration[8.1]
  def change
    create_table :mock_tests do |t|
      t.belongs_to :student, null: false, foreign_key: true
      t.integer :score, null: false
      t.date    :test_date, null: false
      t.string  :result, null: false, default: "pending"

      t.timestamps
    end

    add_index :mock_tests, :test_date
  end
end
