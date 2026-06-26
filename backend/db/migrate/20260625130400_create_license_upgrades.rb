# frozen_string_literal: true

class CreateLicenseUpgrades < ActiveRecord::Migration[8.1]
  def change
    create_table :license_upgrades do |t|
      t.references :student, null: false, foreign_key: true
      t.string :prior_license_key, null: false
      t.string :license_origin, null: false
      t.date :license_issue_date, null: false
      t.string :target_category, null: false
      t.boolean :timir_compound_flag, default: false
      t.string :status, null: false, default: "pending"

      t.timestamps
    end

    add_index :license_upgrades, :prior_license_key, unique: true
    add_index :license_upgrades, :status
  end
end
