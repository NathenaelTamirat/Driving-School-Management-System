# frozen_string_literal: true

class CreateRenewalRequests < ActiveRecord::Migration[8.1]
  def change
    create_table :renewal_requests do |t|
      t.string :full_name, null: false
      t.string :phone_number, null: false
      t.string :email
      t.string :prior_license_number, null: false
      t.string :blood_type
      t.string :eye_acuity_test
      t.boolean :medical_data_updated, default: false
      t.string :registered_kifle_ketema, null: false
      t.string :status, null: false, default: "pending"

      t.timestamps
    end

    add_index :renewal_requests, :prior_license_number
    add_index :renewal_requests, :status
  end
end
