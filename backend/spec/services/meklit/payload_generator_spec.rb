# frozen_string_literal: true

require 'rails_helper'

RSpec.describe Meklit::PayloadGenerator, type: :service do
  let(:batch) { create(:batch, name: 'Test Batch 2024') }
  let(:student1) { create(:student, batch: batch, student_id: 'STU001', document_id: 'DOC001') }
  let(:student2) { create(:student, batch: batch, student_id: 'STU002', document_id: 'DOC002') }

  before do
    batch.students << [ student1, student2 ]
  end

  describe '#generate' do
    it 'generates a complete payload structure' do
      generator = described_class.new(batch)
      payload = generator.generate

      expect(payload).to have_key(:batch)
      expect(payload[:batch]).to have_key(:id)
      expect(payload[:batch]).to have_key(:name)
      expect(payload[:batch]).to have_key(:submission_date)
      expect(payload[:batch]).to have_key(:total_students)
      expect(payload[:batch]).to have_key(:students)
    end

    it 'includes batch information' do
      generator = described_class.new(batch)
      payload = generator.generate

      expect(payload[:batch][:id]).to eq(batch.id)
      expect(payload[:batch][:name]).to eq('Test Batch 2024')
      expect(payload[:batch][:total_students]).to eq(2)
    end

    it 'includes student payloads' do
      generator = described_class.new(batch)
      payload = generator.generate

      expect(payload[:batch][:students].count).to eq(2)
      expect(payload[:batch][:students].first).to have_key(:student_id)
      expect(payload[:batch][:students].first).to have_key(:document_id)
    end

    it 'includes personal information for each student' do
      generator = described_class.new(batch)
      payload = generator.generate

      student_payload = payload[:batch][:students].first
      expect(student_payload[:personal_info]).to have_key(:first_name)
      expect(student_payload[:personal_info]).to have_key(:middle_name)
      expect(student_payload[:personal_info]).to have_key(:last_name)
      expect(student_payload[:personal_info]).to have_key(:date_of_birth)
      expect(student_payload[:personal_info]).to have_key(:blood_type)
    end

    it 'includes address information for each student' do
      generator = described_class.new(batch)
      payload = generator.generate

      student_payload = payload[:batch][:students].first
      expect(student_payload[:address]).to have_key(:address)
      expect(student_payload[:address]).to have_key(:house_number)
      expect(student_payload[:address]).to have_key(:woreda)
      expect(student_payload[:address]).to have_key(:city)
    end

    it 'includes training progress for each student' do
      generator = described_class.new(batch)
      payload = generator.generate

      student_payload = payload[:batch][:students].first
      expect(student_payload[:training_progress]).to have_key(:status)
      expect(student_payload[:training_progress]).to have_key(:theory_days_completed)
      expect(student_payload[:training_progress]).to have_key(:practical_days_completed)
      expect(student_payload[:training_progress]).to have_key(:mock_test_score)
    end

    it 'includes document information for each student' do
      generator = described_class.new(batch)
      payload = generator.generate

      student_payload = payload[:batch][:students].first
      expect(student_payload[:documents]).to have_key(:profile_photo)
      expect(student_payload[:documents]).to have_key(:yellow_card)
      expect(student_payload[:documents]).to have_key(:grade_8_document)
      expect(student_payload[:documents]).to have_key(:grade_10_document)
      expect(student_payload[:documents]).to have_key(:grade_12_document)
    end
  end

  describe '#to_json' do
    it 'returns JSON string' do
      generator = described_class.new(batch)
      json = generator.to_json

      expect(json).to be_a(String)
      parsed = JSON.parse(json)
      expect(parsed['batch']['name']).to eq('Test Batch 2024')
    end
  end

  describe '#to_xml' do
    it 'returns XML string' do
      generator = described_class.new(batch)
      xml = generator.to_xml

      expect(xml).to be_a(String)
      expect(xml).to include('<?xml')
      expect(xml).to include('ERTASubmission')
    end
  end
end
