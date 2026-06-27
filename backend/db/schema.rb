# This file is auto-generated from the current state of the database. Instead
# of editing this file, please use the migrations feature of Active Record to
# incrementally modify your database, and then regenerate this schema definition.
#
# This file is the source Rails uses to define your schema when running `bin/rails
# db:schema:load`. When creating a new database, `bin/rails db:schema:load` tends to
# be faster and is potentially less error prone than running all of your
# migrations from scratch. Old migrations may fail to apply correctly if those
# migrations use external dependencies or application code.
#
# It's strongly recommended that you check this file into your version control system.

ActiveRecord::Schema[8.1].define(version: 2026_06_27_120007) do
  # These are extensions that must be enabled in order to support this database
  enable_extension "pg_catalog.plpgsql"

  create_table "active_storage_attachments", force: :cascade do |t|
    t.bigint "blob_id", null: false
    t.datetime "created_at", null: false
    t.string "name", null: false
    t.bigint "record_id", null: false
    t.string "record_type", null: false
    t.index ["blob_id"], name: "index_active_storage_attachments_on_blob_id"
    t.index ["record_type", "record_id", "name", "blob_id"], name: "index_active_storage_attachments_uniqueness", unique: true
  end

  create_table "active_storage_blobs", force: :cascade do |t|
    t.bigint "byte_size", null: false
    t.string "checksum"
    t.string "content_type"
    t.datetime "created_at", null: false
    t.string "filename", null: false
    t.string "key", null: false
    t.text "metadata"
    t.string "service_name", null: false
    t.index ["key"], name: "index_active_storage_blobs_on_key", unique: true
  end

  create_table "active_storage_variant_records", force: :cascade do |t|
    t.bigint "blob_id", null: false
    t.string "variation_digest", null: false
    t.index ["blob_id", "variation_digest"], name: "index_active_storage_variant_records_uniqueness", unique: true
  end

  create_table "attendance_logs", force: :cascade do |t|
    t.date "attendance_date", null: false
    t.datetime "created_at", null: false
    t.string "digital_signature"
    t.string "instructor_name"
    t.boolean "locked", default: false, null: false
    t.text "notes"
    t.string "phase", null: false
    t.boolean "present", default: false, null: false
    t.bigint "student_id", null: false
    t.datetime "updated_at", null: false
    t.index ["attendance_date"], name: "index_attendance_logs_on_attendance_date"
    t.index ["student_id", "phase", "attendance_date"], name: "idx_attendance_unique_per_day", unique: true
    t.index ["student_id", "phase", "attendance_date"], name: "index_attendance_logs_on_student_phase_date", unique: true
    t.index ["student_id"], name: "index_attendance_logs_on_student_id"
  end

  create_table "batches", force: :cascade do |t|
    t.datetime "approved_at"
    t.datetime "created_at", null: false
    t.jsonb "export_payload"
    t.string "name", null: false
    t.text "rejection_reason"
    t.integer "retry_count", default: 0, null: false
    t.string "status", default: "pending"
    t.datetime "submitted_at"
    t.datetime "updated_at", null: false
    t.index ["name"], name: "index_batches_on_name", unique: true
  end

  create_table "courses", id: :uuid, default: -> { "gen_random_uuid()" }, force: :cascade do |t|
    t.string "course_name", null: false
    t.datetime "created_at", null: false
    t.text "description"
    t.decimal "fast_track_fee", precision: 10, scale: 2
    t.boolean "is_active", default: true
    t.string "license_category", null: false
    t.integer "min_age", null: false
    t.string "min_education_level", null: false
    t.integer "practical_days_required", default: 52, null: false
    t.decimal "premium_fee", precision: 10, scale: 2
    t.decimal "standard_fee", precision: 10, scale: 2, null: false
    t.integer "theory_days_required", default: 35, null: false
    t.datetime "updated_at", null: false
    t.integer "upgrade_discount_percentage", default: 30
    t.index ["is_active"], name: "index_courses_on_is_active"
    t.index ["license_category"], name: "index_courses_on_license_category"
    t.check_constraint "license_category::text = ANY (ARRAY['A'::character varying::text, 'B'::character varying::text, 'C'::character varying::text, 'D'::character varying::text, 'E'::character varying::text])", name: "check_license_category"
  end

  create_table "exam_bookings", force: :cascade do |t|
    t.datetime "completed_at"
    t.datetime "created_at", null: false
    t.string "exam_type", null: false
    t.text "notes"
    t.datetime "scheduled_date", null: false
    t.integer "score"
    t.string "status", default: "scheduled"
    t.bigint "student_id", null: false
    t.datetime "updated_at", null: false
    t.string "venue"
    t.index ["scheduled_date"], name: "index_exam_bookings_on_scheduled_date"
    t.index ["status"], name: "index_exam_bookings_on_status"
    t.index ["student_id", "exam_type", "status"], name: "index_exam_bookings_on_student_exam_type_status"
    t.index ["student_id"], name: "index_exam_bookings_on_student_id"
  end

  create_table "graduation_records", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.jsonb "dossier_contents", default: {}
    t.string "dossier_status", default: "compiling", null: false
    t.date "graduation_date", null: false
    t.bigint "student_id", null: false
    t.string "transfer_destination"
    t.datetime "updated_at", null: false
    t.index ["student_id"], name: "index_graduation_records_on_student_id", unique: true
  end

  create_table "invoices", force: :cascade do |t|
    t.decimal "amount", precision: 10, scale: 2, null: false
    t.datetime "created_at", null: false
    t.text "description"
    t.date "due_date"
    t.string "milestone_type", null: false
    t.datetime "paid_at"
    t.string "status", default: "pending", null: false
    t.bigint "student_id", null: false
    t.datetime "updated_at", null: false
    t.index ["milestone_type"], name: "index_invoices_on_milestone_type"
    t.index ["status"], name: "index_invoices_on_status"
    t.index ["student_id"], name: "index_invoices_on_student_id"
  end

  create_table "jwt_denylist", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.datetime "exp", null: false
    t.string "jti", null: false
    t.datetime "updated_at", null: false
    t.index ["jti"], name: "index_jwt_denylist_on_jti"
  end

  create_table "license_upgrades", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.date "license_issue_date", null: false
    t.string "license_origin", null: false
    t.string "prior_license_key", null: false
    t.text "rejection_reason"
    t.string "status", default: "pending", null: false
    t.bigint "student_id", null: false
    t.string "target_category", null: false
    t.boolean "timir_compound_flag", default: false
    t.datetime "updated_at", null: false
    t.index ["prior_license_key"], name: "index_license_upgrades_on_prior_license_key", unique: true
    t.index ["status"], name: "index_license_upgrades_on_status"
    t.index ["student_id"], name: "index_license_upgrades_on_student_id"
  end

  create_table "mock_tests", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.string "result", default: "pending", null: false
    t.integer "score", null: false
    t.bigint "student_id", null: false
    t.date "test_date", null: false
    t.datetime "updated_at", null: false
    t.index ["student_id"], name: "index_mock_tests_on_student_id"
    t.index ["test_date"], name: "index_mock_tests_on_test_date"
  end

  create_table "payroll_entries", force: :cascade do |t|
    t.integer "active_student_loads", default: 0, null: false
    t.integer "active_training_days", default: 0, null: false
    t.decimal "base_pay", precision: 10, scale: 2, default: "0.0", null: false
    t.datetime "created_at", null: false
    t.datetime "paid_at"
    t.date "period_end", null: false
    t.date "period_start", null: false
    t.string "status", default: "draft", null: false
    t.decimal "total_pay", precision: 10, scale: 2, default: "0.0", null: false
    t.datetime "updated_at", null: false
    t.bigint "user_id", null: false
    t.index ["status"], name: "index_payroll_entries_on_status"
    t.index ["user_id", "period_start", "period_end"], name: "idx_payroll_unique_per_period", unique: true
    t.index ["user_id"], name: "index_payroll_entries_on_user_id"
  end

  create_table "renewal_requests", force: :cascade do |t|
    t.string "blood_type"
    t.datetime "created_at", null: false
    t.string "email"
    t.string "eye_acuity_test"
    t.string "full_name", null: false
    t.boolean "medical_data_updated", default: false
    t.string "phone_number", null: false
    t.string "prior_license_number", null: false
    t.string "registered_kifle_ketema", null: false
    t.string "status", default: "pending", null: false
    t.datetime "updated_at", null: false
    t.index ["prior_license_number"], name: "index_renewal_requests_on_prior_license_number"
    t.index ["status"], name: "index_renewal_requests_on_status"
  end

  create_table "students", force: :cascade do |t|
    t.string "address"
    t.decimal "amount_paid", precision: 10, scale: 2, default: "0.0"
    t.bigint "batch_id", null: false
    t.string "blood_type"
    t.string "city"
    t.uuid "course_id"
    t.datetime "created_at", null: false
    t.date "date_of_birth"
    t.string "document_id"
    t.string "education_level"
    t.string "email"
    t.string "eye_acuity_test"
    t.string "first_name"
    t.string "house_number"
    t.string "identification_document"
    t.string "kebele"
    t.date "last_attendance_date"
    t.string "last_name"
    t.string "license_category"
    t.datetime "meklit_approval_date"
    t.string "middle_name"
    t.boolean "milestone_1_paid", default: false
    t.boolean "milestone_2_paid", default: false
    t.integer "mock_test_score", default: 0
    t.string "n_number"
    t.datetime "penalty_end_date"
    t.decimal "penalty_fee", precision: 10, scale: 2, default: "0.0"
    t.text "penalty_reason"
    t.datetime "penalty_start_date"
    t.integer "practical_days_completed", default: 0
    t.datetime "practical_started_at"
    t.string "pricing_tier", default: "standard"
    t.string "status", default: "registered"
    t.string "student_id"
    t.string "subcity"
    t.integer "theory_days_completed", default: 0
    t.datetime "theory_started_at"
    t.decimal "total_fee", precision: 10, scale: 2
    t.boolean "under_penalty", default: false
    t.datetime "updated_at", null: false
    t.boolean "verified", default: false
    t.datetime "verified_at"
    t.string "woreda"
    t.index ["batch_id"], name: "index_students_on_batch_id"
    t.index ["course_id"], name: "index_students_on_course_id"
    t.index ["document_id"], name: "index_students_on_document_id", unique: true
    t.index ["email"], name: "index_students_on_email", unique: true
    t.index ["license_category"], name: "index_students_on_license_category"
    t.index ["penalty_end_date"], name: "index_students_on_penalty_end_date"
    t.index ["student_id"], name: "index_students_on_student_id", unique: true
    t.index ["under_penalty"], name: "index_students_on_under_penalty"
    t.check_constraint "pricing_tier::text = ANY (ARRAY['standard'::character varying::text, 'premium'::character varying::text, 'fast_track'::character varying::text])", name: "check_pricing_tier"
  end

  create_table "users", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.string "email", default: "", null: false
    t.string "encrypted_password", default: "", null: false
    t.string "full_name", null: false
    t.string "instructor_category"
    t.string "instructor_license_number"
    t.boolean "is_qualified_instructor", default: false
    t.string "phone_number"
    t.datetime "remember_created_at"
    t.datetime "reset_password_sent_at"
    t.string "reset_password_token"
    t.string "role", default: "student", null: false
    t.datetime "updated_at", null: false
    t.integer "years_experience"
    t.index ["email"], name: "index_users_on_email", unique: true
    t.index ["reset_password_token"], name: "index_users_on_reset_password_token", unique: true
    t.index ["role"], name: "index_users_on_role"
    t.check_constraint "role::text = ANY (ARRAY['admin'::character varying::text, 'instructor'::character varying::text, 'clerk'::character varying::text, 'student'::character varying::text])", name: "user_role_check"
  end

  add_foreign_key "active_storage_attachments", "active_storage_blobs", column: "blob_id"
  add_foreign_key "active_storage_variant_records", "active_storage_blobs", column: "blob_id"
  add_foreign_key "attendance_logs", "students"
  add_foreign_key "exam_bookings", "students"
  add_foreign_key "graduation_records", "students"
  add_foreign_key "invoices", "students"
  add_foreign_key "license_upgrades", "students"
  add_foreign_key "mock_tests", "students"
  add_foreign_key "payroll_entries", "users"
  add_foreign_key "students", "batches"
  add_foreign_key "students", "courses"
end
