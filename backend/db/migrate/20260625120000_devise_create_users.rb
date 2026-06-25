# frozen_string_literal: true

class DeviseCreateUsers < ActiveRecord::Migration[8.1]
  def change
    create_table :users do |t|
      ## Database authenticatable
      t.string :email,              null: false, default: ""
      t.string :encrypted_password, null: false, default: ""

      ## Recoverable
      t.string   :reset_password_token
      t.datetime :reset_password_sent_at

      ## Rememberable
      t.datetime :remember_created_at

      ## Application fields
      t.string  :role,       null: false, default: "student"
      t.string  :full_name,  null: false
      t.string  :phone_number

      ## Instructor-specific (only meaningful when role = 'instructor')
      t.string  :instructor_license_number
      t.string  :instructor_category
      t.integer :years_experience
      t.boolean :is_qualified_instructor, default: false

      t.timestamps null: false

      t.check_constraint "role IN ('admin', 'instructor', 'clerk', 'student')", name: "user_role_check"
    end

    add_index :users, :email,                unique: true
    add_index :users, :reset_password_token, unique: true
    add_index :users, :role
  end
end
