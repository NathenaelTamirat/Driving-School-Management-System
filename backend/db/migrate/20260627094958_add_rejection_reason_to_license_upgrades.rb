# frozen_string_literal: true

class AddRejectionReasonToLicenseUpgrades < ActiveRecord::Migration[8.1]
  def change
    add_column :license_upgrades, :rejection_reason, :text
  end
end
