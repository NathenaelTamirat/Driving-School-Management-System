# frozen_string_literal: true

require 'swagger_helper'

RSpec.describe 'api/v1/invoices', type: :request do
  path '/api/v1/invoices' do
    get('list invoices') do
      tags 'Finance - Invoices'
      description 'Retrieve a list of all invoices with optional filtering'
      produces 'application/json'
      security [Bearer: []]
      
      parameter name: :status, in: :query, type: :string, required: false,
                description: 'Filter by status (pending, paid, overdue, cancelled)'
      parameter name: :milestone_type, in: :query, type: :string, required: false,
                description: 'Filter by invoice type'
      parameter name: :student_id, in: :query, type: :string, required: false,
                description: 'Filter by student ID (UUID)'
      parameter name: :page, in: :query, type: :integer, required: false,
                description: 'Page number for pagination'
      parameter name: :per_page, in: :query, type: :integer, required: false,
                description: 'Items per page (default: 20)'

      response(200, 'successful') do
        schema type: :object,
          properties: {
            success: { type: :boolean },
            data: {
              type: :array,
              items: {
                type: :object,
                properties: {
                  id: { type: :string },
                  student_id: { type: :string },
                  student_name: { type: :string },
                  milestone_type: { type: :string },
                  amount: { type: :number },
                  status: { type: :string },
                  paid_at: { type: :string, format: :datetime, nullable: true },
                  created_at: { type: :string, format: :datetime }
                }
              }
            },
            meta: {
              type: :object,
              properties: {
                current_page: { type: :integer },
                total_pages: { type: :integer },
                total_count: { type: :integer },
                per_page: { type: :integer }
              }
            }
          }

        run_test!
      end

      response(401, 'unauthorized') do
        run_test!
      end
    end
  end

  path '/api/v1/invoices/{id}' do
    parameter name: 'id', in: :path, type: :string, description: 'Invoice ID (UUID)'

    get('show invoice') do
      tags 'Finance - Invoices'
      description 'Retrieve details of a specific invoice'
      produces 'application/json'
      security [Bearer: []]

      response(200, 'successful') do
        schema type: :object,
          properties: {
            success: { type: :boolean },
            data: {
              type: :object,
              properties: {
                id: { type: :string },
                student_id: { type: :string },
                student_name: { type: :string },
                milestone_type: { type: :string },
                amount: { type: :number },
                status: { type: :string },
                paid_at: { type: :string, format: :datetime, nullable: true },
                payment_method: { type: :string, nullable: true },
                payment_reference: { type: :string, nullable: true },
                created_at: { type: :string, format: :datetime },
                updated_at: { type: :string, format: :datetime }
              }
            }
          }

        run_test!
      end

      response(404, 'not found') do
        run_test!
      end
    end
  end

  path '/api/v1/invoices/{id}/mark_paid' do
    parameter name: 'id', in: :path, type: :string, description: 'Invoice ID (UUID)'

    post('mark invoice as paid') do
      tags 'Finance - Invoices'
      description 'Mark an invoice as paid with payment details'
      produces 'application/json'
      consumes 'application/json'
      security [Bearer: []]

      parameter name: :payment_details, in: :body, schema: {
        type: :object,
        properties: {
          payment_method: { type: :string, description: 'Payment method (cash, bank_transfer, mobile_money)' },
          payment_reference: { type: :string, description: 'Payment reference number' }
        },
        required: ['payment_method']
      }

      response(200, 'successful') do
        schema type: :object,
          properties: {
            success: { type: :boolean },
            data: {
              type: :object,
              properties: {
                id: { type: :string },
                status: { type: :string },
                paid_at: { type: :string, format: :datetime },
                payment_method: { type: :string },
                payment_reference: { type: :string, nullable: true }
              }
            },
            message: { type: :string }
          }

        run_test!
      end

      response(422, 'already paid or invalid') do
        run_test!
      end

      response(404, 'not found') do
        run_test!
      end
    end
  end

  path '/api/v1/students/{student_id}/invoices' do
    parameter name: 'student_id', in: :path, type: :string, description: 'Student ID (UUID)'

    get('get student invoices') do
      tags 'Finance - Invoices'
      description 'Retrieve all invoices for a specific student'
      produces 'application/json'
      security [Bearer: []]

      parameter name: :status, in: :query, type: :string, required: false,
                description: 'Filter by status'

      response(200, 'successful') do
        schema type: :object,
          properties: {
            success: { type: :boolean },
            data: {
              type: :array,
              items: {
                type: :object,
                properties: {
                  id: { type: :string },
                  milestone_type: { type: :string },
                  amount: { type: :number },
                  status: { type: :string },
                  paid_at: { type: :string, format: :datetime, nullable: true }
                }
              }
            },
            meta: {
              type: :object,
              properties: {
                total_pending: { type: :number },
                total_paid: { type: :number },
                overdue_count: { type: :integer }
              }
            }
          }

        run_test!
      end

      response(404, 'student not found') do
        run_test!
      end
    end
  end
end
