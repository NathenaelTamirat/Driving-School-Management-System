# frozen_string_literal: true

class LmsProgressPolicy < ApplicationPolicy
  def show?
    user.admin? || user.instructor? || user.clerk?
  end
end
