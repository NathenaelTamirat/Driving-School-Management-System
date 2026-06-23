class CreateExamBookings < ActiveRecord::Migration[8.1]
  def change
    create_table :exam_bookings do |t|
      t.belongs_to :student, null: false, foreign_key: true
      t.string :exam_type, null: false # 'theory' or 'practical'
      t.datetime :scheduled_date, null: false
      t.string :venue
      t.string :status, default: 'scheduled' # 'scheduled', 'completed', 'cancelled', 'no_show'
      t.integer :score
      t.text :notes
      t.datetime :completed_at

      t.timestamps
    end

    add_index :exam_bookings, :student_id
    add_index :exam_bookings, :scheduled_date
    add_index :exam_bookings, :status
  end
end
