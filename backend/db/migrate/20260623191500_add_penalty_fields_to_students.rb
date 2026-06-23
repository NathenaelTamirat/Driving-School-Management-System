class AddPenaltyFieldsToStudents < ActiveRecord::Migration[8.1]
  def change
    add_column :students, :under_penalty, :boolean, default: false
    add_column :students, :penalty_start_date, :datetime
    add_column :students, :penalty_end_date, :datetime
    add_column :students, :penalty_reason, :text

    add_index :students, :under_penalty
    add_index :students, :penalty_end_date
  end
end
