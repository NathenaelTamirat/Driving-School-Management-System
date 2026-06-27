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

ActiveRecord::Schema[8.1].define(version: 2026_06_26_140002) do
  # These are extensions that must be enabled in order to support this database
  enable_extension "pg_catalog.plpgsql"

  create_table "batches", force: :cascade do |t|
    t.datetime "approved_at"
    t.datetime "created_at", null: false
    t.string "name", null: false
    t.text "rejection_reason"
    t.integer "retry_count", default: 0, null: false
    t.string "status", default: "pending"
    t.datetime "submitted_at"
    t.datetime "updated_at", null: false
    t.index ["name"], name: "index_batches_on_name", unique: true
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
    t.index ["student_id"], name: "index_exam_bookings_on_student_id"
    t.index ["student_id", "exam_type", "status"], name: "index_exam_bookings_on_student_exam_type_status"
  end

  create_table "jwt_denylist", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.datetime "exp", null: false
    t.string "jti", null: false
    t.datetime "updated_at", null: false
    t.index ["jti"], name: "index_jwt_denylist_on_jti"
  end

  create_table "students", force: :cascade do |t|
    t.string "address"
    t.bigint "batch_id", null: false
    t.string "blood_type"
    t.string "city"
    t.datetime "created_at", null: false
    t.date "date_of_birth"
    t.string "document_id"
    t.string "first_name"
    t.string "house_number"
    t.string "kebele"
    t.date "last_attendance_date"
    t.string "last_name"
    t.string "license_category"
    t.string "middle_name"
    t.integer "mock_test_score", default: 0
    t.datetime "penalty_end_date"
    t.text "penalty_reason"
    t.datetime "penalty_start_date"
    t.integer "practical_days_completed", default: 0
    t.datetime "practical_started_at"
    t.string "status", default: "registered"
    t.string "student_id"
    t.string "subcity"
    t.integer "theory_days_completed", default: 0
    t.datetime "theory_started_at"
    t.boolean "under_penalty", default: false
    t.datetime "updated_at", null: false
    t.boolean "verified", default: false
    t.datetime "verified_at"
    t.string "woreda"
    t.index ["batch_id"], name: "index_students_on_batch_id"
    t.index ["document_id"], name: "index_students_on_document_id", unique: true
    t.index ["license_category"], name: "index_students_on_license_category"
    t.index ["penalty_end_date"], name: "index_students_on_penalty_end_date"
    t.index ["student_id"], name: "index_students_on_student_id", unique: true
    t.index ["under_penalty"], name: "index_students_on_under_penalty"
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
    t.check_constraint "role::text = ANY (ARRAY['admin'::character varying, 'instructor'::character varying, 'clerk'::character varying, 'student'::character varying]::text[])", name: "user_role_check"
  end

  add_foreign_key "exam_bookings", "students"
  add_foreign_key "students", "batches"
end
