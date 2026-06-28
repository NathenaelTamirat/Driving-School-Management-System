# frozen_string_literal: true

module Finance
  class PayrollCalculator
    class Error < StandardError; end
    class PayrollAlreadyExists < Error; end

    BASE_SALARY = 15_000.00
    STUDENT_LOAD_BONUS = 200.00
    PERFORMANCE_BONUS = 1_000.00
    PERFORMANCE_THRESHOLD = 80.0

    attr_reader :instructor, :month, :year, :result

    def initialize(instructor, month: Date.current.month, year: Date.current.year)
      @instructor = instructor
      @month = month
      @year = year
      @result = { success: false, payroll_entry: nil, breakdown: {}, errors: [] }
    end

    def calculate_payroll
      @result = { success: false, payroll_entry: nil, breakdown: {}, errors: [] }
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

    def self.calculate_all_for_month(month: Date.current.month, year: Date.current.year)
      results = { processed: 0, created: 0, skipped: 0, errors: [] }

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
      period_start = Date.new(year, month, 1)
      period_end = period_start.end_of_month

      if PayrollEntry.exists?(user_id: instructor.id, period_start: period_start, period_end: period_end)
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
        base_pay: base,
        student_load_bonus: student_bonus,
        performance_bonus: performance_bonus,
        total_pay: total,
        student_count: student_count,
        pass_rate: pass_rate.round(2)
      }
    end

    def count_active_students
      Student.where(instructor_id: instructor.id)
             .where(status: %w[theory_in_progress practical_in_progress exam_eligible])
             .count
    end

    def calculate_pass_rate
      total_exams = ExamBooking.joins(student: :instructor)
                                .where(students: { instructor_id: instructor.id })
                                .where.not(score: nil)
                                .count

      return 0.0 if total_exams.zero?

      passed_exams = ExamBooking.joins(student: :instructor)
                                .where(students: { instructor_id: instructor.id })
                                .where("score >= ?", ExamBooking::PASSING_SCORE)
                                .count

      (passed_exams.to_f / total_exams * 100).round(2)
    end

    def create_payroll_entry(breakdown)
      period_start = Date.new(year, month, 1)
      period_end = period_start.end_of_month

      PayrollEntry.create!(
        user_id: instructor.id,
        base_pay: breakdown[:base_pay],
        active_student_loads: breakdown[:student_count],
        active_training_days: 0,
        total_pay: breakdown[:total_pay],
        period_start: period_start,
        period_end: period_end,
        status: 'draft'
      )
    end
  end
end
