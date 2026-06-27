# frozen_string_literal: true

module Finance
  class PricingService
    attr_reader :student, :total_fee, :milestone_1, :milestone_2

    def initialize(student)
      @student = student
      @errors = []
    end

    def calculate
      validate_student
      return error_result if @errors.any?

      determine_total_fee
      split_milestones
      create_initial_invoice

      success_result
    rescue StandardError => e
      Rails.logger.error("PricingService error: #{e.message}")
      Rails.logger.error(e.backtrace.join("\n"))
      @errors << "Failed to calculate pricing: #{e.message}"
      error_result
    end

    private

    def validate_student
      @errors << 'Student is required' if @student.nil?
      @errors << 'Course is required' if @student&.course.nil?
      @errors << 'Pricing tier is required' if @student&.pricing_tier.blank?
    end

    def determine_total_fee
      course = @student.course
      
      @total_fee = if @student.is_upgrade?
                     course.upgrade_fee(@student.pricing_tier)
                   else
                     course.fee_for_tier(@student.pricing_tier)
                   end

      # Update student record
      @student.update!(total_fee: @total_fee)
    end

    def split_milestones
      # 50-50 split
      @milestone_1 = (@total_fee * 0.5).round(2)
      @milestone_2 = (@total_fee * 0.5).round(2)
    end

    def create_initial_invoice
      Invoice.create!(
        student: @student,
        invoice_type: @student.is_upgrade? ? 'upgrade' : 'registration',
        amount: @milestone_1,
        description: "#{@student.is_upgrade? ? 'Upgrade' : 'Registration'} + Milestone 1 (50%)",
        due_date: Date.today + 7.days,
        status: 'pending'
      )
    end

    def success_result
      {
        success: true,
        total_fee: @total_fee,
        milestone_1: @milestone_1,
        milestone_2: @milestone_2,
        message: 'Pricing calculated successfully'
      }
    end

    def error_result
      {
        success: false,
        errors: @errors,
        message: 'Failed to calculate pricing'
      }
    end
  end
end
