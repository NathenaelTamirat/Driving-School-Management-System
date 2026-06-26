# frozen_string_literal: true

require 'swagger_helper'

RSpec.describe 'api/v1/financial_reports', type: :request do
  path '/api/v1/financial_reports/summary' do
    get('get financial summary') do
      tags 'Finance - Reports'
      description 'Get comprehensive financial summary including revenue, collections, and outstanding payments'
      produces 'application/json'
      security [Bearer: []]

      parameter name: :start_date, in: :query, type: :string, format: :date, required: false,
                description: 'Start date (YYYY-MM-DD, defaults to beginning of current month)'
      parameter name: :end_date, in: :query, type: :string, format: :date, required: false,
                description: 'End date (YYYY-MM-DD, defaults to end of current month)'

      response(200, 'successful') do
        schema type: :object,
          properties: {
            success: { type: :boolean },
            data: {
              type: :object,
              properties: {
                period: {
                  type: :object,
                  properties: {
                    start_date: { type: :string, format: :date },
                    end_date: { type: :string, format: :date },
                    days: { type: :integer }
                  }
                },
                revenue: {
                  type: :object,
                  properties: {
                    total_revenue: { type: :number },
                    invoice_count: { type: :integer },
                    average_invoice: { type: :number },
                    student_count: { type: :integer }
                  }
                },
                collections: {
                  type: :object,
                  properties: {
                    total_issued: { type: :number },
                    total_collected: { type: :number },
                    collection_rate: { type: :number },
                    pending_amount: { type: :number },
                    overdue_amount: { type: :number }
                  }
                },
                outstanding: {
                  type: :object,
                  properties: {
                    total_outstanding: { type: :number },
                    pending_count: { type: :integer },
                    overdue_count: { type: :integer },
                    aging: { type: :object },
                    top_delinquent_students: { type: :array }
                  }
                }
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

  path '/api/v1/financial_reports/revenue' do
    get('get revenue report') do
      tags 'Finance - Reports'
      description 'Get detailed revenue analytics by type, tier, and trends'
      produces 'application/json'
      security [Bearer: []]

      parameter name: :start_date, in: :query, type: :string, format: :date, required: false
      parameter name: :end_date, in: :query, type: :string, format: :date, required: false

      response(200, 'successful') do
        schema type: :object,
          properties: {
            success: { type: :boolean },
            data: {
              type: :object,
              properties: {
                revenue_summary: {
                  type: :object,
                  properties: {
                    total_revenue: { type: :number },
                    invoice_count: { type: :integer },
                    average_invoice: { type: :number },
                    student_count: { type: :integer }
                  }
                },
                by_type: {
                  type: :array,
                  items: {
                    type: :object,
                    properties: {
                      type: { type: :string },
                      revenue: { type: :number },
                      count: { type: :integer },
                      average: { type: :number }
                    }
                  }
                },
                by_tier: {
                  type: :array,
                  items: {
                    type: :object,
                    properties: {
                      tier: { type: :string },
                      revenue: { type: :number },
                      student_count: { type: :integer }
                    }
                  }
                },
                trends: {
                  type: :array,
                  items: {
                    type: :object,
                    properties: {
                      date: { type: :string, format: :date },
                      amount: { type: :number }
                    }
                  }
                }
              }
            }
          }

        run_test!
      end
    end
  end

  path '/api/v1/financial_reports/collections' do
    get('get collections report') do
      tags 'Finance - Reports'
      description 'Get collection performance metrics and outstanding payments analysis'
      produces 'application/json'
      security [Bearer: []]

      parameter name: :start_date, in: :query, type: :string, format: :date, required: false
      parameter name: :end_date, in: :query, type: :string, format: :date, required: false

      response(200, 'successful') do
        schema type: :object,
          properties: {
            success: { type: :boolean },
            data: {
              type: :object,
              properties: {
                collection_summary: {
                  type: :object,
                  properties: {
                    total_issued: { type: :number },
                    total_collected: { type: :number },
                    collection_rate: { type: :number },
                    pending_amount: { type: :number },
                    overdue_amount: { type: :number }
                  }
                },
                outstanding_summary: {
                  type: :object,
                  properties: {
                    total_outstanding: { type: :number },
                    pending_count: { type: :integer },
                    overdue_count: { type: :integer },
                    aging: {
                      type: :object,
                      properties: {
                        '0-30 days': { type: :number },
                        '31-60 days': { type: :number },
                        '61-90 days': { type: :number },
                        '90+ days': { type: :number }
                      }
                    }
                  }
                }
              }
            }
          }

        run_test!
      end
    end
  end

  path '/api/v1/financial_reports/monthly_comparison' do
    get('get monthly comparison') do
      tags 'Finance - Reports'
      description 'Compare financial metrics across multiple months'
      produces 'application/json'
      security [Bearer: []]

      parameter name: :months, in: :query, type: :integer, required: false,
                description: 'Number of months to compare (default: 3)'

      response(200, 'successful') do
        schema type: :object,
          properties: {
            success: { type: :boolean },
            data: {
              type: :array,
              items: {
                type: :object,
                properties: {
                  month: { type: :string },
                  total_issued: { type: :number },
                  total_collected: { type: :number },
                  collection_rate: { type: :number }
                }
              }
            }
          }

        run_test!
      end
    end
  end

  path '/api/v1/financial_reports/export' do
    get('export financial report') do
      tags 'Finance - Reports'
      description 'Export financial report as CSV file'
      produces 'text/csv'
      security [Bearer: []]

      parameter name: :start_date, in: :query, type: :string, format: :date, required: false
      parameter name: :end_date, in: :query, type: :string, format: :date, required: false

      response(200, 'successful') do
        schema type: :string, format: :binary

        run_test!
      end
    end
  end

  path '/api/v1/financial_reports/reconcile' do
    post('trigger payment reconciliation') do
      tags 'Finance - Reports'
      description 'Manually trigger payment reconciliation for a date range'
      produces 'application/json'
      consumes 'application/json'
      security [Bearer: []]

      parameter name: :reconciliation_params, in: :body, schema: {
        type: :object,
        properties: {
          start_date: { type: :string, format: :date, description: 'Start date (defaults to today)' },
          end_date: { type: :string, format: :date, description: 'End date (defaults to today)' }
        }
      }

      response(200, 'successful') do
        schema type: :object,
          properties: {
            success: { type: :boolean },
            data: {
              type: :object,
              properties: {
                summary: {
                  type: :object,
                  properties: {
                    total_students_checked: { type: :integer },
                    discrepancies_found: { type: :integer },
                    total_overpayments: { type: :number },
                    total_underpayments: { type: :number },
                    unmatched_invoices: { type: :integer }
                  }
                },
                details: {
                  type: :object,
                  properties: {
                    overpayments: { type: :array },
                    underpayments: { type: :array },
                    unmatched_payments: { type: :array }
                  }
                }
              }
            },
            message: { type: :string }
          }

        run_test!
      end

      response(422, 'unprocessable entity') do
        run_test!
      end
    end
  end
end
