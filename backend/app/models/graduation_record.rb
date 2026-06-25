# frozen_string_literal: true

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
