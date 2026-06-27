class AddIdentificationDocumentToStudents < ActiveRecord::Migration[8.1]
  def change
    add_column :students, :identification_document, :string
  end
end
