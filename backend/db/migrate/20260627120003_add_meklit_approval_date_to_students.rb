class AddMeklitApprovalDateToStudents < ActiveRecord::Migration[8.1]
  def change
    add_column :students, :meklit_approval_date, :datetime
  end
end
