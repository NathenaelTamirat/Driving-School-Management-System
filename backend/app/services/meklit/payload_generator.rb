# frozen_string_literal: true

module Meklit
  # Generates XML/JSON payload for Meklit API submission
  # Formats student data according to ERTA specifications
  class PayloadGenerator
    attr_reader :batch, :students

    def initialize(batch)
      @batch = batch
      @students = batch.students.includes(:batch)
    end

    # Generate the complete payload for batch submission
    # Returns a hash structure that can be serialized to XML or JSON
    def generate
      {
        batch: {
          id: batch.id,
          name: batch.name,
          submission_date: Time.current.iso8601,
          total_students: students.count,
          students: student_payloads
        }
      }
    end

    # Generate XML format payload
    def to_xml
      generate.to_xml(root: "ERTASubmission", dasherize: false)
    end

    # Generate JSON format payload
    def to_json(*args)
      generate.to_json(*args)
    end

    private

    # Generate individual student payloads
    def student_payloads
      students.map do |student|
        {
          student_id: student.student_id,
          document_id: student.document_id,
          personal_info: personal_info(student),
          address: address_info(student),
          training_progress: training_info(student),
          documents: document_info(student),
          verification: {
            verified: student.verified || false,
            verified_at: student.verified_at
          }
        }
      end
    end

    # Personal information section
    def personal_info(student)
      {
        first_name: student.first_name,
        middle_name: student.middle_name,
        last_name: student.last_name,
        date_of_birth: student.date_of_birth,
        blood_type: student.blood_type
      }
    end

    # Address information section
    def address_info(student)
      {
        address: student.address,
        house_number: student.house_number,
        kebele: student.kebele,
        woreda: student.woreda,
        subcity: student.subcity,
        city: student.city
      }
    end

    # Training progress information
    def training_info(student)
      {
        status: student.status,
        theory_days_completed: student.theory_days_completed,
        practical_days_completed: student.practical_days_completed,
        mock_test_score: student.mock_test_score,
        batch_name: student.batch.name
      }
    end

    # Document information section
    # Adjust based on actual document storage implementation
    def document_info(student)
      {
        profile_photo: document_url(student, :profile_photo),
        yellow_card: document_url(student, :yellow_card),
        grade_8_document: document_url(student, :grade_8),
        grade_10_document: document_url(student, :grade_10),
        grade_12_document: document_url(student, :grade_12),
        medical_document: document_url(student, :medical)
      }
    end

    # Helper to get document URL/path
    # Adjust based on actual storage implementation (ActiveStorage, S3, etc.)
    def document_url(student, doc_type)
      if student.respond_to?(doc_type) && student.send(doc_type).attached?
        Rails.application.routes.url_helpers.rails_blob_url(student.send(doc_type), only_path: true)
      elsif student.respond_to?("#{doc_type}_path")
        student.send("#{doc_type}_path")
      else
        nil
      end
    end
  end
end
