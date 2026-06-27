# frozen_string_literal: true

class AttendanceLogPolicy < ApplicationPolicy
  def index?
    staff?
  end

  def create?
    user.admin? || user.instructor? || user.clerk?
  end

  private

  def staff?
    user.admin? || user.instructor? || user.clerk?
  end
end
