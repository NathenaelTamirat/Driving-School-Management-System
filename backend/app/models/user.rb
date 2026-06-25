# frozen_string_literal: true

class User < ApplicationRecord
  # Denylist strategy: tokens are revoked by recording them in jwt_denylist.
  devise :database_authenticatable,
         :registerable,
         :recoverable,
         :rememberable,
         :validatable,
         :jwt_authenticatable,
         jwt_revocation_strategy: JwtDenylist

  ROLES = %w[admin instructor clerk student].freeze

  validates :full_name, presence: true
  validates :role, presence: true, inclusion: { in: ROLES }
  validates :instructor_license_number, presence: true, if: :instructor?
  validates :years_experience,
            numericality: { greater_than_or_equal_to: 0 }, allow_nil: true

  # NOTE: associations to students/attendance/payroll are intentionally NOT
  # declared yet. Those tables/FKs don't exist on main (instructors are tracked
  # by an instructor_name string per the team decision). Add them when the FK
  # columns land.

  scope :admins, -> { where(role: "admin") }
  scope :instructors, -> { where(role: "instructor") }
  scope :clerks, -> { where(role: "clerk") }
  scope :student_users, -> { where(role: "student") }
  scope :qualified_instructors, -> { where(role: "instructor", is_qualified_instructor: true) }

  def admin?
    role == "admin"
  end

  def instructor?
    role == "instructor"
  end

  def clerk?
    role == "clerk"
  end

  def student?
    role == "student"
  end
end
