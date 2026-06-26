# frozen_string_literal: true

module Api
  module V1
    # Authenticated controller for ERTA submission batches.
    # Requires a valid JWT. Allows listing, viewing, and creating batches
    # that group students for bulk export to the ERTA (Ethiopian Road
    # Transport Authority) system. Batches are the unit of approval: once
    # submitted, ERTA either approves or rejects the entire batch, which
    # graduates or returns the contained students.
    class BatchesController < BaseController
      before_action :set_batch, only: [ :show ]

      # GET /api/v1/batches
      def index
        page     = params.fetch(:page, 1).to_i
        per_page = params.fetch(:per_page, 50).to_i.clamp(1, 200)
        @batches = Batch.order(:created_at).page(page).per(per_page)
        render_success({
          batches: @batches.as_json,
          meta: { page: page, per_page: per_page, total: Batch.count }
        })
      end

      # GET /api/v1/batches/:id
      def show
        render_success(@batch)
      end

      # POST /api/v1/batches
      def create
        @batch = Batch.new(batch_params)

        if @batch.save
          render_success(@batch, status: :created)
        else
          render_error("Failed to create batch", errors: @batch.errors.full_messages)
        end
      end

      private

      def set_batch
        @batch = Batch.find(params[:id])
      rescue ActiveRecord::RecordNotFound
        render_error("Batch not found", status: :not_found, code: "NOT_FOUND")
      end

      def batch_params
        params.require(:batch).permit(:name, :status)
      end
    end
  end
end
