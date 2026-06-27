# frozen_string_literal: true

class StudentPolicy < ApplicationPolicy
  def index?
    staff?
  end

  def show?
    staff?
  end

  def create?
    admin_or_clerk?
  end

  def update?
    admin_or_clerk?
  end

  def destroy?
    user.admin?
  end

  private

  def staff?
    user.admin? || user.instructor? || user.clerk?
  end

  def admin_or_clerk?
    user.admin? || user.clerk?
  end
end
