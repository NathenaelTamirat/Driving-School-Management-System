# frozen_string_literal: true

class ExamBookingPolicy < ApplicationPolicy
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

  def cancel?
    admin_or_clerk?
  end

  def record_result?
    admin_or_clerk?
  end

  private

  def staff?
    user.admin? || user.instructor? || user.clerk?
  end

  def admin_or_clerk?
    user.admin? || user.clerk?
  end
end
