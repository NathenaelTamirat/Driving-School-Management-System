# frozen_string_literal: true

module Api
  module V1
    class BatchesController < ApplicationController
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
