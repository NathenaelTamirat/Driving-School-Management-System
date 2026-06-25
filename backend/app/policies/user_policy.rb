# frozen_string_literal: true

class UserPolicy < ApplicationPolicy
  def index?
    user.admin?
  end

  def show?
    user.admin? || record == user
  end

  def create?
    user.admin?
  end

  def update?
    user.admin? || record == user
  end

  def destroy?
    user.admin? && record != user
  end

  class Scope < ApplicationPolicy::Scope
    def resolve
      user.admin? ? scope.all : scope.where(id: user.id)
    end
  end
end
