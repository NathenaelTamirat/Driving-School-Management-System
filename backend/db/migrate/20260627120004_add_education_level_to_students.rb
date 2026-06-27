class AddEducationLevelToStudents < ActiveRecord::Migration[8.1]
  def change
    add_column :students, :education_level, :string
  end
end
