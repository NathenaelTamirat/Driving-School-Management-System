# frozen_string_literal: true

class CreateAttendanceLogs < ActiveRecord::Migration[8.1]
  def change
    create_table :attendance_logs do |t|
      t.belongs_to :student, null: false, foreign_key: true
      t.string :phase, null: false
      t.date :attendance_date, null: false
      t.boolean :present, null: false, default: false
      t.boolean :locked, null: false, default: false
      t.string :instructor_name
      t.string :digital_signature
      t.text :notes

      t.timestamps
    end

    add_index :attendance_logs, %i[student_id phase attendance_date],
              unique: true,
              name: "idx_attendance_unique_per_day"

    add_index :attendance_logs, :attendance_date
  end
end
