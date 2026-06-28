# frozen_string_literal: true

require 'rails_helper'

RSpec.describe Finance::PayrollCalculator, type: :service do
  let(:instructor) do
    create(:user,
      role: 'instructor',
      full_name: 'Test Instructor',
      instructor_license_number: 'LIC-001',
      instructor_category: 'B'
    )
  end

  describe '#calculate_payroll' do
    subject(:calculator) { described_class.new(instructor, month: 6, year: 2024) }

    context 'base salary only' do
      it 'calculates base pay of 15,000 ETB' do
        result = calculator.calculate_payroll
        expect(result[:breakdown][:base_pay]).to eq(15_000)
      end

      it 'creates payroll entry' do
        expect { calculator.calculate_payroll }.to change(PayrollEntry, :count).by(1)
      end

      it 'returns success' do
        result = calculator.calculate_payroll
        expect(result[:success]).to be true
      end
    end

    context 'with student load bonus' do
      it 'adds 200 ETB per student' do
        allow_any_instance_of(described_class).to receive(:count_active_students).and_return(10)

        result = calculator.calculate_payroll
        expect(result[:breakdown][:student_load_bonus]).to eq(2000)
        expect(result[:breakdown][:total_pay]).to eq(17_000)
      end
    end

    context 'with performance bonus' do
      it 'adds 1,000 ETB when pass rate > 80%' do
        allow_any_instance_of(described_class).to receive(:calculate_pass_rate).and_return(85.0)

        result = calculator.calculate_payroll
        expect(result[:breakdown][:performance_bonus]).to eq(1000)
      end

      it 'does not add bonus when pass rate <= 80%' do
        allow_any_instance_of(described_class).to receive(:calculate_pass_rate).and_return(75.0)

        result = calculator.calculate_payroll
        expect(result[:breakdown][:performance_bonus]).to eq(0)
      end
    end

    context 'full salary calculation' do
      it 'calculates all components correctly' do
        allow_any_instance_of(described_class).to receive(:count_active_students).and_return(15)
        allow_any_instance_of(described_class).to receive(:calculate_pass_rate).and_return(90.0)

        result = calculator.calculate_payroll

        expect(result[:breakdown][:base_pay]).to eq(15_000)
        expect(result[:breakdown][:student_load_bonus]).to eq(3000)
        expect(result[:breakdown][:performance_bonus]).to eq(1000)
        expect(result[:breakdown][:total_pay]).to eq(19_000)
      end
    end

    context 'idempotency' do
      it 'does not create duplicate payroll entries' do
        calculator.calculate_payroll
        expect { calculator.calculate_payroll }.not_to change(PayrollEntry, :count)
      end

      it 'returns error on duplicate attempt' do
        calculator.calculate_payroll
        result = calculator.calculate_payroll

        expect(result[:success]).to be false
        expect(result[:errors]).to include(match(/already exists/))
      end
    end

    context 'validation' do
      it 'rejects non-instructor users' do
        admin = create(:user, role: 'admin')
        calculator = described_class.new(admin, month: 6, year: 2024)

        result = calculator.calculate_payroll
        expect(result[:success]).to be false
        expect(result[:errors]).to include(match(/instructor/))
      end
    end
  end

  describe '.calculate_all_for_month' do
    let!(:instructor1) { create(:user, role: 'instructor', instructor_license_number: 'LIC-001', instructor_category: 'B') }
    let!(:instructor2) { create(:user, role: 'instructor', instructor_license_number: 'LIC-002', instructor_category: 'B') }
    let!(:admin) { create(:user, role: 'admin') }

    it 'processes all instructors' do
      results = described_class.calculate_all_for_month(month: 6, year: 2024)
      expect(results[:processed]).to eq(2)
      expect(results[:created]).to eq(2)
    end

    it 'creates payroll entries for all instructors' do
      expect {
        described_class.calculate_all_for_month(month: 6, year: 2024)
      }.to change(PayrollEntry, :count).by(2)
    end

    it 'does not process non-instructors' do
      described_class.calculate_all_for_month(month: 6, year: 2024)
      expect(PayrollEntry.where(user_id: admin.id).count).to eq(0)
    end
  end
end
