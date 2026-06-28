# frozen_string_literal: true

module Api
  module V1
    # InvoicesController - Manages student invoice operations
    # Endpoints: index, show, mark_paid, student invoices
    class InvoicesController < BaseController
      before_action :set_invoice, only: [:show, :mark_paid]

      # GET /api/v1/invoices
      # Query params: status (pending/paid/overdue), milestone_type, student_id
      def index
        invoices = Invoice.includes(:student).all

        # Filter by status
        invoices = invoices.where(status: params[:status]) if params[:status].present?

        # Filter by milestone_type
        invoices = invoices.where(milestone_type: params[:milestone_type]) if params[:milestone_type].present?

        # Filter by student_id
        invoices = invoices.where(student_id: params[:student_id]) if params[:student_id].present?

        # Pagination
        page = params[:page] || 1
        per_page = params[:per_page] || 20
        invoices = invoices.page(page).per(per_page)

        render json: {
          success: true,
          data: invoices.map { |invoice| invoice_json(invoice) },
          meta: pagination_meta(invoices)
        }, status: :ok
      end

      # GET /api/v1/invoices/:id
      def show
        render json: {
          success: true,
          data: invoice_json(@invoice)
        }, status: :ok
      end

      # POST /api/v1/invoices/:id/mark_paid
      # Body: { payment_method: 'cash/bank_transfer/mobile_money', payment_reference: 'REF123' }
      def mark_paid
        if @invoice.paid?
          return render json: {
            success: false,
            errors: ['Invoice is already paid']
          }, status: :unprocessable_entity
        end

        @invoice.transaction do
          @invoice.update!(
            status: 'paid',
            paid_at: Time.current,
            payment_method: params[:payment_method],
            payment_reference: params[:payment_reference]
          )

          # Update student milestone paid flags
          update_student_milestone_flags if @invoice.milestone_invoice?
        end

        render json: {
          success: true,
          data: invoice_json(@invoice),
          message: 'Invoice marked as paid successfully'
        }, status: :ok
      rescue ActiveRecord::RecordInvalid => e
        render json: {
          success: false,
          errors: e.record.errors.full_messages
        }, status: :unprocessable_entity
      end

      # GET /api/v1/students/:student_id/invoices
      def student_invoices
        student = Student.find(params[:student_id])
        invoices = student.invoices.order(created_at: :desc)

        # Filter by status
        invoices = invoices.where(status: params[:status]) if params[:status].present?

        render json: {
          success: true,
          data: invoices.map { |invoice| invoice_json(invoice) },
          meta: {
            total_pending: student.invoices.pending.sum(:amount),
            total_paid: student.invoices.paid.sum(:amount),
            overdue_count: student.invoices.overdue.count
          }
        }, status: :ok
      rescue ActiveRecord::RecordNotFound
        render json: {
          success: false,
          errors: ['Student not found']
        }, status: :not_found
      end

      private

      def set_invoice
        @invoice = Invoice.includes(:student).find(params[:id])
      rescue ActiveRecord::RecordNotFound
        render json: {
          success: false,
          errors: ['Invoice not found']
        }, status: :not_found
      end

      def invoice_json(invoice)
        {
          id: invoice.id,
          invoice_number: invoice.invoice_number,
          student_id: invoice.student_id,
          student_name: invoice.student ? "#{invoice.student.first_name} #{invoice.student.last_name}" : nil,
          milestone_type: invoice.milestone_type,
          amount: invoice.amount,
          status: invoice.status,
          due_date: invoice.due_date,
          paid_at: invoice.paid_at,
          payment_method: invoice.payment_method,
          payment_reference: invoice.payment_reference,
          description: invoice.description,
          metadata: invoice.metadata,
          is_overdue: invoice.overdue?,
          created_at: invoice.created_at,
          updated_at: invoice.updated_at
        }
      end

      def pagination_meta(collection)
        {
          current_page: collection.current_page,
          total_pages: collection.total_pages,
          total_count: collection.total_count,
          per_page: collection.limit_value
        }
      end

      def update_student_milestone_flags
        student = @invoice.student
        
        case @invoice.milestone_type
        when Invoice::MILESTONE_TYPES[:registration_and_theory]
          student.update!(milestone_1_paid: true)
        when Invoice::MILESTONE_TYPES[:practical_fee_release]
          student.update!(milestone_2_paid: true)
        end
      end
    end
  end
end
