# frozen_string_literal: true

module Api
  module V1
    # Admin-managed user CRUD (authorized via UserPolicy).
    class UsersController < BaseController
      before_action :set_user, only: [ :show, :update, :destroy ]

      # GET /api/v1/users
      def index
        authorize User
        users = policy_scope(User).order(:created_at)
        render_success(users.map { |u| user_response(u) })
      end

      # GET /api/v1/users/:id
      def show
        authorize @user
        render_success(user_response(@user))
      end

      # POST /api/v1/users  (admin can create any role)
      def create
        authorize User
        user = User.new(user_params)

        if user.save
          render_success(user_response(user), status: :created, message: "User created")
        else
          render_error("Failed to create user", status: :unprocessable_entity,
                                                 code: "VALIDATION_ERROR", errors: user.errors.as_json)
        end
      end

      # PATCH/PUT /api/v1/users/:id
      def update
        authorize @user

        if @user.update(user_params.compact)
          render_success(user_response(@user), message: "User updated")
        else
          render_error("Failed to update user", status: :unprocessable_entity,
                                                 code: "VALIDATION_ERROR", errors: @user.errors.as_json)
        end
      end

      # DELETE /api/v1/users/:id
      def destroy
        authorize @user
        @user.destroy
        render_success({}, message: "User deleted")
      end

      private

      def set_user
        @user = User.find(params[:id])
      end

      def user_params
        params.require(:user).permit(
          :email, :password, :password_confirmation, :full_name, :phone_number, :role,
          :instructor_license_number, :instructor_category, :years_experience, :is_qualified_instructor
        )
      end

      def user_response(user)
        {
          id: user.id, email: user.email, full_name: user.full_name, role: user.role,
          phone_number: user.phone_number, is_qualified_instructor: user.is_qualified_instructor,
          created_at: user.created_at
        }
      end
    end
  end
end
