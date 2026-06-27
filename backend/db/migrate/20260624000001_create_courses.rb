# frozen_string_literal: true

class CreateCourses < ActiveRecord::Migration[8.0]
  def change
    create_table :courses, id: :uuid do |t|
      t.string :course_name, null: false
      t.string :license_category, null: false
      t.text :description
      
      # Requirements
      t.integer :theory_days_required, default: 35, null: false
      t.integer :practical_days_required, default: 52, null: false
      t.string :min_education_level, null: false
      t.integer :min_age, null: false
      
      # Pricing
      t.decimal :standard_fee, precision: 10, scale: 2, null: false
      t.decimal :premium_fee, precision: 10, scale: 2
      t.decimal :fast_track_fee, precision: 10, scale: 2
      t.integer :upgrade_discount_percentage, default: 30
      
      # Status
      t.boolean :is_active, default: true
      
      t.timestamps
    end

    add_index :courses, :license_category
    add_index :courses, :is_active
    
    # Add check constraint for license category
    execute <<-SQL
      ALTER TABLE courses
      ADD CONSTRAINT check_license_category
      CHECK (license_category IN ('A', 'B', 'C', 'D', 'E'));
    SQL
  end
end
