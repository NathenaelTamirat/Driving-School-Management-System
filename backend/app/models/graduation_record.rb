# frozen_string_literal: true

# Tracks the ERTA dossier lifecycle for a graduated student.
# A dossier must be compiled locally, marked ready, then transferred to ERTA.
# Once transferred (dossier_status: "transferred"), the student is officially
# certified by the Ethiopian Road Transport Authority.
class GraduationRecord < ApplicationRecord
  belongs_to :student

  DOSSIER_STATUSES = %w[compiling ready transferred].freeze

  validates :graduation_date, presence: true
  validates :dossier_status,  inclusion: { in: DOSSIER_STATUSES }

  scope :compiling,   -> { where(dossier_status: "compiling") }
  scope :ready,       -> { where(dossier_status: "ready") }
  scope :transferred, -> { where(dossier_status: "transferred") }

  def transferred?
    dossier_status == "transferred"
  end
end
