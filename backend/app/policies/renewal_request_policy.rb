# frozen_string_literal: true

class RenewalRequestPolicy < ApplicationPolicy
  def index?
    user.admin? || user.clerk?
  end

  def show?
    user.admin? || user.clerk?
  end

  def create?
    true
  end

  def submit?
    user.admin? || user.clerk?
  end

  def complete?
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
