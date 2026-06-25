# frozen_string_literal: true

class CreateGraduationRecords < ActiveRecord::Migration[8.1]
  def change
    create_table :graduation_records do |t|
      t.belongs_to :student, null: false, foreign_key: true, index: { unique: true }
      t.date   :graduation_date, null: false
      t.string :dossier_status,  null: false, default: "compiling"
      t.string :transfer_destination
      t.jsonb  :dossier_contents, default: {}

      t.timestamps
    end
  end
end
