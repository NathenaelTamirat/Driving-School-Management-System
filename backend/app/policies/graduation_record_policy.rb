# frozen_string_literal: true

class GraduationRecordPolicy < ApplicationPolicy
  def show?
    admin_or_clerk?
  end

  def create?
    admin_or_clerk?
  end

  private

  def admin_or_clerk?
    user.admin? || user.clerk?
  end
end
