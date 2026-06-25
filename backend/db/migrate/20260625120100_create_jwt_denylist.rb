# frozen_string_literal: true

# Backing table for the devise-jwt Denylist revocation strategy.
class CreateJwtDenylist < ActiveRecord::Migration[8.1]
  def change
    create_table :jwt_denylist do |t|
      t.string   :jti, null: false
      t.datetime :exp, null: false

      t.timestamps null: false
    end

    add_index :jwt_denylist, :jti
  end
end
