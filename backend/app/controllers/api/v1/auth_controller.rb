# frozen_string_literal: true

module Api
  module V1
    class AuthController < BaseController
      skip_before_action :authenticate_user!, only: [ :login, :register ]

      # POST /api/v1/auth/login
      def login
        user = User.find_by(email: login_params[:email].to_s.downcase)

        if user&.valid_password?(login_params[:password])
          render_success(
            { user: user_response(user), token: jwt_for(user) },
            message: "Login successful"
          )
        else
          render_error("Invalid email or password", status: :unauthorized, code: "INVALID_CREDENTIALS")
        end
      end

      # POST /api/v1/auth/register
      # Public self-registration is restricted to the `student` role; privileged
      # accounts (admin/instructor/clerk) are created via UsersController by an admin.
      def register
        user = User.new(register_params)
        user.role = "student"

        if user.save
          render_success(
            { user: user_response(user), token: jwt_for(user) },
            status: :created, message: "Registration successful"
          )
        else
          render_error("Registration failed", status: :unprocessable_entity,
                                               code: "REGISTRATION_FAILED", errors: user.errors.as_json)
        end
      end

      # DELETE /api/v1/auth/logout
      # The token is denylisted by the devise-jwt revocation middleware.
      def logout
        render_success({}, message: "Logout successful")
      end

      # GET /api/v1/auth/me
      def me
        render_success({ user: user_response(current_user) }, message: "Current user retrieved")
      end

      private

      def login_params
        params.require(:auth).permit(:email, :password)
      end

      def register_params
        params.require(:auth).permit(:email, :password, :password_confirmation, :full_name, :phone_number)
      end

      # Mints a JWT for the user (also valid for the Denylist revocation strategy).
      def jwt_for(user)
        Warden::JWTAuth::UserEncoder.new.call(user, :user, nil).first
      end

      def user_response(user)
        {
          id: user.id,
          email: user.email,
          full_name: user.full_name,
          role: user.role,
          phone_number: user.phone_number,
          is_qualified_instructor: user.is_qualified_instructor,
          created_at: user.created_at
        }
      end
    end
  end
end
