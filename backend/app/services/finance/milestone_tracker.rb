# frozen_string_literal: true

module Finance
  # MilestoneTracker - Event-driven invoice generation on state transitions
  # Monitors Student state changes and generates Milestone 2 invoices when eligible
  #
  # Called by: Student model callbacks (after state transitions)
  # Transaction boundary: MUST be atomic with state transition
  class MilestoneTracker
    class Error < StandardError; end
    class IneligibleForMilestone < Error; end
    class MilestoneAlreadyInvoiced < Error; end

    attr_reader :student, :result

    def initialize(student)
      @student = student
      @result = { success: false, invoice: nil, errors: [] }
    end

    # Generate Milestone 2 invoice when student transitions to practical_in_progress
    # Guards:
    #   - Student must be in practical_in_progress state
    #   - mock_test_score must be > 37
    #   - milestone_1_paid must be true
    #   - No existing milestone_2 invoice
    def generate_milestone_2_invoice
      @result = { success: false, invoice: nil, errors: [] }
      validate_milestone_2_eligibility!

      invoice = create_milestone_2_invoice
      
      @result[:success] = true
      @result[:invoice] = invoice
      
      Rails.logger.info "Generated Milestone 2 invoice ##{invoice.invoice_number} for Student ##{student.id}"
      
      @result
    rescue IneligibleForMilestone, MilestoneAlreadyInvoiced => e
      @result[:errors] << e.message
      Rails.logger.warn "Milestone 2 invoice generation failed for Student ##{student.id}: #{e.message}"
      @result
    rescue StandardError => e
      @result[:errors] << "Unexpected error: #{e.message}"
      Rails.logger.error "Milestone 2 invoice generation error for Student ##{student.id}: #{e.class} - #{e.message}"
      Rails.logger.error e.backtrace.join("\n")
      @result
    end

    # Check if student is eligible for milestone 2 invoice (idempotent check)
    def milestone_2_eligible?
      student.status == 'practical_in_progress' &&
        student.mock_test_score > 37 &&
        student.milestone_1_paid? &&
        !milestone_2_invoice_exists?
    end

    private

    def validate_milestone_2_eligibility!
      unless student.status == 'practical_in_progress'
        raise IneligibleForMilestone, "Student must be in practical_in_progress state"
      end

      unless student.mock_test_score > 37
        raise IneligibleForMilestone, "Mock test score must be > 37 (current: #{student.mock_test_score})"
      end

      unless student.milestone_1_paid?
        raise IneligibleForMilestone, "Milestone 1 must be paid before generating Milestone 2 invoice"
      end

      if milestone_2_invoice_exists?
        raise MilestoneAlreadyInvoiced, "Milestone 2 invoice already exists for this student"
      end
    end

    def milestone_2_invoice_exists?
      Invoice.exists?(
        student: student,
        milestone_type: Invoice::MILESTONE_TYPES[:practical_fee_release],
        status: %w[pending paid]
      )
    end

    def create_milestone_2_invoice
      Invoice.create!(
        student: student,
        milestone_type: Invoice::MILESTONE_TYPES[:practical_fee_release],
        amount: student.total_fee / 2.0,
        due_date: 30.days.from_now,
        status: 'pending',
        description: "Milestone 2 payment - Practical training phase (50% of total fee)"
      )
    end
  end
end
