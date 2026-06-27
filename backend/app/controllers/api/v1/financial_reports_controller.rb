# frozen_string_literal: true

module Api
  module V1
    # FinancialReportsController - Generate and export financial reports
    # Endpoints for revenue, collection, and payment reconciliation reports
    class FinancialReportsController < BaseController
      # GET /api/v1/financial_reports/summary
      # Query params: start_date, end_date
      def summary
        start_date = parse_date(params[:start_date], Date.current.beginning_of_month)
        end_date = parse_date(params[:end_date], Date.current.end_of_month)

        reports = Finance::FinancialReports.new(start_date: start_date, end_date: end_date)
        summary = reports.generate_summary

        render json: {
          success: true,
          data: summary
        }, status: :ok
      end

      # GET /api/v1/financial_reports/revenue
      def revenue
        start_date = parse_date(params[:start_date], Date.current.beginning_of_month)
        end_date = parse_date(params[:end_date], Date.current.end_of_month)

        reports = Finance::FinancialReports.new(start_date: start_date, end_date: end_date)

        render json: {
          success: true,
          data: {
            revenue_summary: reports.revenue_summary,
            by_type: reports.revenue_by_invoice_type,
            by_tier: reports.revenue_by_pricing_tier,
            trends: reports.payment_trends
          }
        }, status: :ok
      end

      # GET /api/v1/financial_reports/collections
      def collections
        start_date = parse_date(params[:start_date], Date.current.beginning_of_month)
        end_date = parse_date(params[:end_date], Date.current.end_of_month)

        reports = Finance::FinancialReports.new(start_date: start_date, end_date: end_date)

        render json: {
          success: true,
          data: {
            collection_summary: reports.collection_summary,
            outstanding_summary: reports.outstanding_summary
          }
        }, status: :ok
      end

      # GET /api/v1/financial_reports/monthly_comparison
      def monthly_comparison
        months = params[:months]&.to_i || 3
        reports = Finance::FinancialReports.new

        render json: {
          success: true,
          data: reports.monthly_comparison(months: months)
        }, status: :ok
      end

      # GET /api/v1/financial_reports/export
      # Exports financial report as CSV
      def export
        start_date = parse_date(params[:start_date], Date.current.beginning_of_month)
        end_date = parse_date(params[:end_date], Date.current.end_of_month)

        reports = Finance::FinancialReports.new(start_date: start_date, end_date: end_date)
        csv_data = reports.export_to_csv

        send_data csv_data,
          filename: "financial_report_#{start_date}_to_#{end_date}.csv",
          type: 'text/csv',
          disposition: 'attachment'
      end

      # POST /api/v1/financial_reports/reconcile
      # Manually trigger payment reconciliation
      def reconcile
        start_date = parse_date(params[:start_date], Date.current)
        end_date = parse_date(params[:end_date], Date.current)

        reconciliation = Finance::PaymentReconciliation.new(
          start_date: start_date,
          end_date: end_date
        )

        reconciliation.reconcile_all
        report = reconciliation.generate_report

        render json: {
          success: true,
          data: report,
          message: 'Payment reconciliation completed'
        }, status: :ok
      rescue StandardError => e
        render json: {
          success: false,
          errors: [e.message]
        }, status: :unprocessable_entity
      end

      private

      def parse_date(date_string, default)
        return default if date_string.blank?
        
        Date.parse(date_string)
      rescue ArgumentError
        default
      end
    end
  end
end
