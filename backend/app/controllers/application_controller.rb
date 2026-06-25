class ApplicationController < ActionController::API
  include Pundit::Authorization

  # Pundit authorization failures -> 403. Existing controllers that never call
  # `authorize` are unaffected.
  rescue_from Pundit::NotAuthorizedError, with: :forbidden

  private

  def forbidden
    render json: {
      success: false,
      error: { message: "You are not authorized to perform this action", code: "FORBIDDEN" }
    }, status: :forbidden
  end
end
