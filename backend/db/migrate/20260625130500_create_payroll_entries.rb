# frozen_string_literal: true

class CreatePayrollEntries < ActiveRecord::Migration[8.1]
  def change
    create_table :payroll_entries do |t|
      t.references :user, null: false, foreign_key: true
      t.decimal :base_pay, precision: 10, scale: 2, null: false, default: 0
      t.integer :active_student_loads, null: false, default: 0
      t.integer :active_training_days, null: false, default: 0
      t.decimal :total_pay, precision: 10, scale: 2, null: false, default: 0
      t.date :period_start, null: false
      t.date :period_end, null: false
      t.string :status, null: false, default: "draft"
      t.datetime :paid_at

      t.timestamps
    end

    add_index :payroll_entries, :status
    add_index :payroll_entries, %i[user_id period_start period_end],
              unique: true,
              name: "idx_payroll_unique_per_period"
  end
end
