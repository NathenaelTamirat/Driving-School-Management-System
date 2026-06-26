# frozen_string_literal: true

class CreateInvoices < ActiveRecord::Migration[8.1]
  def change
    create_table :invoices do |t|
      t.references :student, null: false, foreign_key: true
      t.decimal :amount, precision: 10, scale: 2, null: false
      t.string :milestone_type, null: false
      t.string :status, null: false, default: "pending"
      t.date :due_date
      t.datetime :paid_at
      t.text :description

      t.timestamps
    end

    add_index :invoices, :status
    add_index :invoices, :milestone_type
  end
end
