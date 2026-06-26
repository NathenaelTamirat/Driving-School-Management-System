Rails.application.routes.draw do
  # Define your application routes per the DSL in https://guides.rubyonrails.org/routing.html

  # Reveal health status on /up that returns 200 if the app boots with no exceptions, otherwise 500.
  # Can be used by load balancers and uptime monitors to verify that the app is live.
  get "up" => "rails/health#show", as: :rails_health_check

  # Registers the :user Devise mapping (and controller helpers like
  # authenticate_user! / current_user) without generating Devise's default
  # routes — we expose custom auth endpoints under /api/v1/auth instead.
  devise_for :users, skip: :all

  # API v1 routes
  namespace :api do
    namespace :v1 do
      # Authentication
      post   "auth/login",    to: "auth#login"
      post   "auth/register", to: "auth#register"
      delete "auth/logout",   to: "auth#logout"
      get    "auth/me",       to: "auth#me"

      # User management (admin-managed via UserPolicy)
      resources :users, only: [ :index, :show, :create, :update, :destroy ]

      resources :batches, only: [ :index, :show, :create ]
      resources :license_categories, only: [ :index ]
      resources :students, only: [ :index, :show, :create ] do
        # LMS module
        get "lms_progress", to: "lms_progress#show"
        resources :attendance_logs, only: [ :index, :create ]
        resources :mock_tests, only: [ :index, :create ]

        # Graduation module (one record per student → singular resource)
        resource :graduation_record, only: [ :show, :create ]

        resources :exam_bookings, only: [ :index, :show, :create, :update ] do
          post :cancel, on: :member
          post :record_result, on: :member
        end
      end
    end
  end

  # Defines the root path route ("/")
  # root "posts#index"
end
