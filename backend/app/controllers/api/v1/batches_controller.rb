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
        @batches = Batch.all
        render json: @batches
      end

      # GET /api/v1/batches/:id
      def show
        render json: @batch
      end

      # POST /api/v1/batches
      def create
        @batch = Batch.new(batch_params)

        if @batch.save
          render json: @batch, status: :created
        else
          render json: { errors: @batch.errors.full_messages }, status: :unprocessable_entity
        end
      end

      private

      def set_batch
        @batch = Batch.find(params[:id])
      rescue ActiveRecord::RecordNotFound
        render json: { error: "Batch not found" }, status: :not_found
      end

      def batch_params
        params.require(:batch).permit(:name, :status)
      end
    end
  end
end
