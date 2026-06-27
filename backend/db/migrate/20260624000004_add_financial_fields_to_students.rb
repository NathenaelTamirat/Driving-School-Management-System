# frozen_string_literal: true

class AddFinancialFieldsToStudents < ActiveRecord::Migration[8.0]
  def change
    add_reference :students, :course, foreign_key: true, type: :uuid
    
    add_column :students, :pricing_tier, :string, default: 'standard'
    add_column :students, :total_fee, :decimal, precision: 10, scale: 2
    add_column :students, :amount_paid, :decimal, precision: 10, scale: 2, default: 0
    add_column :students, :milestone_1_paid, :boolean, default: false
    add_column :students, :milestone_2_paid, :boolean, default: false
    add_column :students, :penalty_fee, :decimal, precision: 10, scale: 2, default: 0
    
    # Add check constraint
    execute <<-SQL
      ALTER TABLE students
      ADD CONSTRAINT check_pricing_tier
      CHECK (pricing_tier IN ('standard', 'premium', 'fast_track'));
    SQL
  end
end
