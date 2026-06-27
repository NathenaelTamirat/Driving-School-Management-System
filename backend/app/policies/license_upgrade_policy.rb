# frozen_string_literal: true

class LicenseUpgradePolicy < ApplicationPolicy
  def index?
    user.admin? || user.clerk?
  end

  def show?
    user.admin? || user.clerk?
  end

  def create?
    user.admin? || user.clerk?
  end

  def approve?
    user.admin? || user.clerk?
  end

  def reject?
    user.admin? || user.clerk?
  end

  class Scope < ApplicationPolicy::Scope
    def resolve
      if user.admin? || user.clerk?
        scope.all
      else
        scope.none
      end
    end
  end
end
