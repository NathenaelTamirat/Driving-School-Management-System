# frozen_string_literal: true

class AddAttendanceLogsCompositeIndex < ActiveRecord::Migration[8.1]
  def change
    add_index :attendance_logs, [:student_id, :phase, :attendance_date],
              unique: true,
              name: "index_attendance_logs_on_student_phase_date"
  end
end
