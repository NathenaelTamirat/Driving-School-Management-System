class AddEyeAcuityTestToStudents < ActiveRecord::Migration[8.1]
  def change
    add_column :students, :eye_acuity_test, :string
  end
end
