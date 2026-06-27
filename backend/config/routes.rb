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
      post   "auth/refresh",  to: "auth#refresh"
      get    "auth/me",       to: "auth#me"

      # User management (admin-managed via UserPolicy)
      resources :users, only: [ :index, :show, :create, :update, :destroy ]

      resources :batches, only: [ :index, :show, :create ]
      resources :license_categories, only: [ :index ]
      resources :course_categories, only: [ :index ]
      resources :students, only: [ :index, :show, :create, :update ] do
        # Student-specific invoices (Finance Module)
        get 'invoices', to: 'invoices#student_invoices'
        
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
        resources :attendance_logs, only: [ :index, :create ]
        resources :mock_tests, only: [ :index, :create ]
        resource :lms_progress, only: [ :show ]
      end

      # Finance Module - Invoice management
      resources :invoices, only: [ :index, :show ] do
        post :mark_paid, on: :member
      end

      # Finance Module - Payroll Entries (instructor salary view)
      resources :payroll_entries, only: [ :index, :show ]

      # MASADEG / License Upgrade Module
      resources :license_upgrades, only: [ :index, :show, :create ] do
        member do
          post :approve
          post :reject
        end
      end

      # Renewal Requests Module (external license renewal bypass)
      resources :renewal_requests, only: [ :index, :show, :create ] do
        member do
          post :submit
          post :complete
          post :reject
        end
      end

      # Finance Module - Financial Reports
      namespace :financial_reports do
        get :summary
        get :revenue
        get :collections
        get :monthly_comparison
        get :export
        post :reconcile
      end
    end
  end

  # Defines the root path route ("/")
  # root "posts#index"

  # Swagger / OpenAPI documentation UI
  mount Rswag::Ui::Engine => "/api-docs"
  mount Rswag::Api::Engine => "/api-docs"
end
