# frozen_string_literal: true

module Finance
  # FinancialReports - Generate financial reports and analytics
  # Provides revenue, collection, and outstanding payment reports
  #
  # Called by: Admin dashboard or scheduled reports
  class FinancialReports
    attr_reader :start_date, :end_date

    def initialize(start_date: Date.current.beginning_of_month, end_date: Date.current.end_of_month)
      @start_date = start_date
      @end_date = end_date
    end

    # Generate comprehensive financial summary
    def generate_summary
      {
        period: period_info,
        revenue: revenue_summary,
        collections: collection_summary,
        outstanding: outstanding_summary,
        by_type: revenue_by_invoice_type,
        by_tier: revenue_by_pricing_tier,
        trends: payment_trends,
        generated_at: Time.current
      }
    end

    # Revenue summary for the period
    def revenue_summary
      paid_invoices = invoices_in_period.paid

      {
        total_revenue: paid_invoices.sum(:amount),
        invoice_count: paid_invoices.count,
        average_invoice: calculate_average(paid_invoices),
        student_count: paid_invoices.select(:student_id).distinct.count
      }
    end

    # Collection performance metrics
    def collection_summary
      all_invoices = invoices_in_period

      {
        total_issued: all_invoices.sum(:amount),
        total_collected: all_invoices.paid.sum(:amount),
        collection_rate: calculate_collection_rate(all_invoices),
        pending_amount: all_invoices.pending.sum(:amount),
        overdue_amount: all_invoices.overdue.sum(:amount)
      }
    end

    # Outstanding payments analysis
    def outstanding_summary
      outstanding = Invoice.where(status: ['pending', 'overdue'])

      {
        total_outstanding: outstanding.sum(:amount),
        pending_count: outstanding.pending.count,
        overdue_count: outstanding.overdue.count,
        aging: calculate_aging(outstanding),
        top_delinquent_students: top_delinquent_students(5)
      }
    end

    # Revenue breakdown by invoice type
    def revenue_by_invoice_type
      invoices_in_period.paid
        .group(:milestone_type)
        .select('milestone_type, SUM(amount) as total, COUNT(*) as count')
        .map do |result|
          {
            type: result.milestone_type,
            revenue: result.total.to_f,
            count: result.count,
            average: result.count > 0 ? (result.total.to_f / result.count).round(2) : 0
          }
        end
    end

    # Revenue breakdown by pricing tier (if student has pricing_tier)
    def revenue_by_pricing_tier
      return [] unless Student.column_names.include?('pricing_tier')

      Student.joins(:invoices)
        .where(invoices: { status: 'paid', created_at: @start_date..@end_date })
        .group(:pricing_tier)
        .select('students.pricing_tier, SUM(invoices.amount) as total, COUNT(DISTINCT students.id) as student_count')
        .map do |result|
          {
            tier: result.pricing_tier || 'not_set',
            revenue: result.total.to_f,
            student_count: result.student_count
          }
        end
    end

    # Payment trends over the period
    def payment_trends
      invoices_in_period.paid
        .group("DATE(paid_at)")
        .sum(:amount)
        .map { |date, amount| { date: date, amount: amount.to_f } }
    end

    # Monthly comparison report
    def monthly_comparison(months: 3)
      months.times.map do |i|
        month_start = Date.current.beginning_of_month - i.months
        month_end = month_start.end_of_month
        
        month_invoices = Invoice.where(created_at: month_start..month_end)
        
        {
          month: month_start.strftime('%B %Y'),
          total_issued: month_invoices.sum(:amount),
          total_collected: month_invoices.paid.sum(:amount),
          collection_rate: calculate_collection_rate(month_invoices)
        }
      end.reverse
    end

    # Export report to CSV format
    def export_to_csv
      require 'csv'

      CSV.generate(headers: true) do |csv|
        csv << ['Period', "#{@start_date} to #{@end_date}"]
        csv << []
        
        csv << ['Revenue Summary']
        revenue = revenue_summary
        revenue.each { |key, value| csv << [key.to_s.titleize, value] }
        csv << []
        
        csv << ['Collection Summary']
        collection = collection_summary
        collection.each { |key, value| csv << [key.to_s.titleize, value] }
        csv << []
        
        csv << ['Outstanding Payments']
        outstanding = outstanding_summary
        outstanding.each { |key, value| csv << [key.to_s.titleize, value] unless key == :aging || key == :top_delinquent_students }
      end
    end

    private

    def period_info
      {
        start_date: @start_date,
        end_date: @end_date,
        days: (@end_date - @start_date).to_i + 1
      }
    end

    def invoices_in_period
      Invoice.where(created_at: @start_date.beginning_of_day..@end_date.end_of_day)
    end

    def calculate_average(invoices)
      count = invoices.count
      return 0.0 if count.zero?
      
      (invoices.sum(:amount).to_f / count).round(2)
    end

    def calculate_collection_rate(invoices)
      total_issued = invoices.sum(:amount).to_f
      return 0.0 if total_issued.zero?
      
      total_collected = invoices.paid.sum(:amount).to_f
      ((total_collected / total_issued) * 100).round(2)
    end

    def calculate_aging(outstanding_invoices)
      aging_buckets = {
        '0-30 days' => 0,
        '31-60 days' => 0,
        '61-90 days' => 0,
        '90+ days' => 0
      }

      outstanding_invoices.each do |invoice|
        days_old = (Date.current - invoice.created_at.to_date).to_i
        
        case days_old
        when 0..30
          aging_buckets['0-30 days'] += invoice.amount.to_f
        when 31..60
          aging_buckets['31-60 days'] += invoice.amount.to_f
        when 61..90
          aging_buckets['61-90 days'] += invoice.amount.to_f
        else
          aging_buckets['90+ days'] += invoice.amount.to_f
        end
      end

      aging_buckets
    end

    def top_delinquent_students(limit = 5)
      Student.joins(:invoices)
        .where(invoices: { status: ['pending', 'overdue'] })
        .group('students.id', 'students.first_name', 'students.last_name', 'students.student_id')
        .select('students.*, SUM(invoices.amount) as total_owed, COUNT(invoices.id) as invoice_count')
        .order('total_owed DESC')
        .limit(limit)
        .map do |student|
          {
            student_id: student.student_id,
            name: "#{student.first_name} #{student.last_name}",
            total_owed: student.total_owed.to_f,
            invoice_count: student.invoice_count
          }
        end
    end
  end
end
