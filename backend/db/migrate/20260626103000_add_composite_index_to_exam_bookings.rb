# frozen_string_literal: true

class AddCompositeIndexToExamBookings < ActiveRecord::Migration[8.1]
  disable_ddl_transaction!

  def change
    add_index :exam_bookings, %i[student_id exam_type status],
              name: "index_exam_bookings_on_student_exam_type_status",
              algorithm: :concurrently
  end
end
