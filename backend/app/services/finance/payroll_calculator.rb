# frozen_string_literal: true

module Finance
  # PayrollCalculator - Monthly instructor compensation calculation
  # Calculates base salary + student load bonus + performance bonus
  #
  # Called by: PayrollComputeJob (monthly cron)
  # Transaction boundary: Per-instructor atomic
  class PayrollCalculator
    class Error < StandardError; end
    class PayrollAlreadyExists < Error; end

    BASE_SALARY = 15_000.00  # 15,000 ETB base salary
    STUDENT_LOAD_BONUS = 200.00  # 200 ETB per student
    PERFORMANCE_BONUS = 1_000.00  # 1,000 ETB if pass rate > 80%
    PERFORMANCE_THRESHOLD = 80.0  # 80% pass rate threshold

    attr_reader :instructor, :month, :year, :result

    def initialize(instructor, month: Date.current.month, year: Date.current.year)
      @instructor = instructor
      @month = month
      @year = year
      @result = { success: false, payroll_entry: nil, breakdown: {}, errors: [] }
    end

    # Calculate and create monthly payroll entry
    def calculate_payroll
      validate_instructor!
      check_duplicate_payroll!

      breakdown = calculate_components
      payroll_entry = create_payroll_entry(breakdown)

      @result[:success] = true
      @result[:payroll_entry] = payroll_entry
      @result[:breakdown] = breakdown

      Rails.logger.info "Payroll calculated for Instructor ##{instructor.id} (#{month}/#{year}): #{breakdown[:total_salary]} ETB"
      
      @result
    rescue PayrollAlreadyExists => e
      @result[:errors] << e.message
      Rails.logger.warn "Payroll calculation skipped for Instructor ##{instructor.id}: #{e.message}"
      @result
    rescue StandardError => e
      @result[:errors] << "Payroll calculation failed: #{e.message}"
      Rails.logger.error "Payroll calculation error for Instructor ##{instructor.id}: #{e.class} - #{e.message}"
      Rails.logger.error e.backtrace.join("\n")
      @result
    end

    # Batch calculate: process all instructors for the given month (called by cron job)
    def self.calculate_all_for_month(month: Date.current.month, year: Date.current.year)
      results = { processed: 0, created: 0, skipped: 0, errors: [] }

      # TODO: Replace with actual Instructor model query when implemented
      # User.instructors.find_each do |instructor|
      # For now, mock with users having role 'instructor'
      User.where(role: 'instructor').find_each do |instructor|
        results[:processed] += 1

        calculator = new(instructor, month: month, year: year)
        result = calculator.calculate_payroll

        if result[:success]
          results[:created] += 1
        else
          results[:skipped] += 1 if result[:errors].any? { |e| e.include?('already exists') }
          results[:errors] << { instructor_id: instructor.id, errors: result[:errors] }
        end
      end

      Rails.logger.info "PayrollBatch (#{month}/#{year}): #{results[:processed]} instructors, #{results[:created]} created, #{results[:skipped]} skipped"
      results
    rescue StandardError => e
      Rails.logger.error "PayrollBatch failed: #{e.class} - #{e.message}"
      results[:errors] << { batch_error: e.message }
      results
    end

    private

    def validate_instructor!
      unless instructor.is_a?(User) && instructor.role == 'instructor'
        raise Error, "Invalid instructor: must be a User with role 'instructor'"
      end
    end

    def check_duplicate_payroll!
      payroll_date = Date.new(year, month, 1)
      if PayrollEntry.exists?(instructor: instructor, payroll_month: payroll_date)
        raise PayrollAlreadyExists, "Payroll entry already exists for #{month}/#{year}"
      end
    end

    def calculate_components
      student_count = count_active_students
      pass_rate = calculate_pass_rate

      base = BASE_SALARY
      student_bonus = student_count * STUDENT_LOAD_BONUS
      performance_bonus = pass_rate > PERFORMANCE_THRESHOLD ? PERFORMANCE_BONUS : 0.0

      total = base + student_bonus + performance_bonus

      {
        base_salary: base,
        student_load_bonus: student_bonus,
        performance_bonus: performance_bonus,
        total_salary: total,
        student_count: student_count,
        pass_rate: pass_rate.round(2)
      }
    end

    def count_active_students
      # TODO: Replace with actual Student-Instructor relationship query when implemented
      # instructor.students.where(status: [:theory_in_progress, :practical_in_progress, :exam_eligible]).count
      
      # Mock implementation - return random count for now
      # In production, this would query the actual student-instructor assignments
      0
    end

    def calculate_pass_rate
      # TODO: Replace with actual exam results query when implemented
      # total_exams = instructor.students.joins(:exam_bookings).where('exam_bookings.result IS NOT NULL').count
      # passed_exams = instructor.students.joins(:exam_bookings).where(exam_bookings: { result: 'pass' }).count
      # total_exams > 0 ? (passed_exams.to_f / total_exams * 100) : 0.0
      
      # Mock implementation - return 0 for now
      # In production, this would calculate actual pass rate from exam results
      0.0
    end

    def create_payroll_entry(breakdown)
      PayrollEntry.create!(
        instructor: instructor,
        payroll_month: Date.new(year, month, 1),
        base_salary: breakdown[:base_salary],
        student_count: breakdown[:student_count],
        student_load_bonus: breakdown[:student_load_bonus],
        performance_bonus: breakdown[:performance_bonus],
        total_amount: breakdown[:total_salary],
        payment_status: 'pending'
      )
    end
  end
end
