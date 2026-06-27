# frozen_string_literal: true

class AddLicenseCategoryToStudents < ActiveRecord::Migration[8.1]
  def change
    add_column :students, :license_category, :string
    add_index :students, :license_category
  end
end
