class AddInstructorToStudents < ActiveRecord::Migration[8.1]
  def change
    add_reference :students, :instructor, foreign_key: { to_table: :users }
  end
end
