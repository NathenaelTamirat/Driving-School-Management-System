class AddPaymentFieldsToInvoices < ActiveRecord::Migration[8.1]
  def change
    add_column :invoices, :payment_method, :string
    add_column :invoices, :payment_reference, :string
    add_column :invoices, :metadata, :jsonb, default: {}
    add_column :invoices, :invoice_number, :string
    add_index :invoices, :invoice_number, unique: true
    add_index :invoices, :payment_method
  end
end
