# Sprint 2 - Finance Module Testing Guide

Quick reference for testing the Finance Module implementation.

---

## Prerequisites

```bash
# Ensure you're on the correct branch
git checkout henok/pricing-service

# Check Docker is running
docker --version

# Start containers
docker-compose up -d

# Check container status
docker-compose ps
```

---

## Database Setup

```bash
# Install dependencies
docker-compose exec rails-api bundle install

# Run migrations
docker-compose exec rails-api rails db:migrate

# Seed course data
docker-compose exec rails-api rails db:seed

# Verify migrations
docker-compose exec rails-api rails db:migrate:status

# Check database (optional)
docker-compose exec rails-api rails dbconsole
```

---

## Rails Console Testing

```bash
# Open Rails console
docker-compose exec rails-api rails console
```

### Test 1: PricingService

```ruby
# Get course and batch
course = Course.first
batch = Batch.first

# Create test student
student = Student.new(
  student_id: "TEST-#{SecureRandom.hex(3).upcase}",
  document_id: "DOC-#{SecureRandom.hex(3).upcase}",
  first_name: "Test",
  middle_name: "Finance",
  last_name: "Student",
  date_of_birth: 20.years.ago,
  blood_type: "O+",
  address: "Bole, Addis Ababa",
  house_number: "H-123",
  woreda: "Woreda 01",
  city: "Addis Ababa",
  batch_id: batch.id,
  status: 'registered'
)

# Test pricing calculation
pricing = Finance::PricingService.new(student, course, 'standard')
result = pricing.calculate_and_create_invoice

# Verify results
puts "✅ Success: #{result[:success]}"
puts "📊 Total Fee: #{result[:total_fee]} ETB"
puts "🧾 Invoice: #{result[:invoice].invoice_number}"
puts "💰 Milestone 1: #{result[:milestone_1_amount]} ETB"
puts "💰 Milestone 2: #{result[:milestone_2_amount]} ETB"

# Check invoice was created
student.save
puts "📝 Invoices created: #{student.invoices.count}"
```

### Test 2: MilestoneTracker

```ruby
# Get the test student
student = Student.find_by(first_name: "Test", last_name: "Student")

# Update student to meet milestone 2 requirements
student.update(
  theory_days_completed: 35,
  mock_test_score: 45,
  milestone_1_paid: true
)

# Transition to theory in progress
student.start_theory!

# Transition to practical (should trigger Milestone 2 invoice)
student.start_practical!

# Verify Milestone 2 invoice was created
milestone_2 = student.invoices.find_by(invoice_type: 'milestone_2')
puts "✅ Milestone 2 Invoice: #{milestone_2.invoice_number}"
puts "💰 Amount: #{milestone_2.amount} ETB"
puts "📅 Due Date: #{milestone_2.due_date}"
```

### Test 3: PenaltyEngine

```ruby
# Test attendance breach detection
student = Student.where(status: [:theory_in_progress, :practical_in_progress]).first

engine = Finance::PenaltyEngine.new(student)
result = engine.check_attendance_breach

puts "✅ Breach Check: #{result[:success] ? 'Penalty Created' : 'No Breach'}"
puts "📝 Message: #{result[:message]}"

# Test batch scan
results = Finance::PenaltyEngine.scan_all_for_attendance_breaches
puts "\n📊 Batch Scan Results:"
puts "   - Students Scanned: #{results[:scanned]}"
puts "   - Penalties Created: #{results[:penalties_created]}"
puts "   - Errors: #{results[:errors].count}"
```

### Test 4: PayrollCalculator

```ruby
# Get an instructor
instructor = User.where(role: 'instructor').first

# If no instructors exist, create one
if instructor.nil?
  instructor = User.create!(
    email: "instructor@test.com",
    password: "password123",
    password_confirmation: "password123",
    full_name: "Test Instructor",
    role: "instructor",
    instructor_license_number: "LIC-#{SecureRandom.hex(4).upcase}",
    instructor_category: "A",
    years_experience: 5
  )
end

# Calculate payroll
calculator = Finance::PayrollCalculator.new(instructor, month: Date.current.month, year: Date.current.year)
result = calculator.calculate_payroll

puts "✅ Success: #{result[:success]}"
puts "💰 Base Salary: #{result[:breakdown][:base_salary]} ETB"
puts "💰 Student Bonus: #{result[:breakdown][:student_load_bonus]} ETB"
puts "💰 Performance Bonus: #{result[:breakdown][:performance_bonus]} ETB"
puts "💰 Total: #{result[:breakdown][:total_salary]} ETB"
puts "📊 Student Count: #{result[:breakdown][:student_count]}"
puts "📊 Pass Rate: #{result[:breakdown][:pass_rate]}%"

# Test batch calculation
results = Finance::PayrollCalculator.calculate_all_for_month
puts "\n📊 Batch Payroll Results:"
puts "   - Instructors Processed: #{results[:processed]}"
puts "   - Entries Created: #{results[:created]}"
puts "   - Skipped: #{results[:skipped]}"
```

### Test 5: Invoice Operations

```ruby
# List all invoices
invoices = Invoice.all
puts "📝 Total Invoices: #{invoices.count}"
puts "   - Pending: #{Invoice.pending.count}"
puts "   - Paid: #{Invoice.paid.count}"
puts "   - Overdue: #{Invoice.overdue.count}"

# Mark an invoice as paid
invoice = Invoice.pending.first
if invoice
  invoice.update(
    status: 'paid',
    paid_at: Time.current,
    payment_method: 'cash',
    payment_reference: "CASH-#{SecureRandom.hex(4).upcase}"
  )
  puts "✅ Invoice #{invoice.invoice_number} marked as paid"
end
```

---

## API Endpoint Testing

### Get Authentication Token

```bash
# Register or login
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "password": "password"
  }' | jq

# Save token
export TOKEN="<paste_token_here>"
```

### Test Invoice Endpoints

```bash
# 1. List all invoices
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:3000/api/v1/invoices | jq

# 2. List pending invoices
curl -H "Authorization: Bearer $TOKEN" \
  "http://localhost:3000/api/v1/invoices?status=pending" | jq

# 3. List milestone invoices
curl -H "Authorization: Bearer $TOKEN" \
  "http://localhost:3000/api/v1/invoices?invoice_type=milestone_1" | jq

# 4. Get specific invoice
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:3000/api/v1/invoices/<INVOICE_ID> | jq

# 5. Get student invoices
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:3000/api/v1/students/<STUDENT_ID>/invoices | jq

# 6. Mark invoice as paid
curl -X POST \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "payment_method": "cash",
    "payment_reference": "CASH-TEST-001"
  }' \
  http://localhost:3000/api/v1/invoices/<INVOICE_ID>/mark_paid | jq
```

---

## Background Job Testing

```bash
# Open Rails console
docker-compose exec rails-api rails console
```

### Test AttendanceBreachScanJob

```ruby
# Run job manually
AttendanceBreachScanJob.perform_now

# Check job status
puts "✅ Job completed successfully"
```

### Test PayrollComputeJob

```ruby
# Run for current month
PayrollComputeJob.perform_now

# Run for specific month
PayrollComputeJob.perform_now(month: 6, year: 2024)

puts "✅ Payroll calculation completed"
```

---

## Verification Checklist

### Database Tables
```bash
docker-compose exec rails-api rails dbconsole
```

```sql
-- Check courses
SELECT * FROM courses LIMIT 3;

-- Check invoices
SELECT invoice_number, invoice_type, amount, status FROM invoices;

-- Check payroll entries
SELECT * FROM payroll_entries;

-- Check student financial fields
SELECT student_id, pricing_tier, total_fee, milestone_1_paid, milestone_2_paid 
FROM students LIMIT 5;
```

### Models
```ruby
# In Rails console
Course.count          # Should be 3
Invoice.count         # Should have invoices
PayrollEntry.count    # Check payroll entries
Student.first.invoices.count  # Check associations
```

### Services
```ruby
# Check service files exist
Dir.glob('app/services/finance/*.rb')

# Check jobs exist
Dir.glob('app/jobs/*.rb')
```

---

## Common Issues & Solutions

### Issue 1: Migrations not running
```bash
# Check migration status
docker-compose exec rails-api rails db:migrate:status

# Rollback and retry
docker-compose exec rails-api rails db:rollback STEP=4
docker-compose exec rails-api rails db:migrate
```

### Issue 2: Bundle install fails
```bash
# Rebuild container
docker-compose down
docker-compose build rails-api
docker-compose up -d
```

### Issue 3: No courses seeded
```bash
# Run seeds again (idempotent)
docker-compose exec rails-api rails db:seed
```

### Issue 4: Authentication fails
```bash
# Create admin user
docker-compose exec rails-api rails console

User.create!(
  email: 'admin@test.com',
  password: 'password123',
  password_confirmation: 'password123',
  full_name: 'Admin User',
  role: 'admin'
)
```

---

## Performance Testing

### Load Test (Optional)

```ruby
# In Rails console - Create 100 students with invoices
100.times do |i|
  course = Course.first
  student = Student.create!(
    student_id: "LOAD-#{i.to_s.rjust(3, '0')}",
    document_id: "DOC-LOAD-#{i.to_s.rjust(3, '0')}",
    first_name: "Load",
    middle_name: "Test",
    last_name: "Student#{i}",
    date_of_birth: 20.years.ago,
    blood_type: "O+",
    address: "Test Address",
    house_number: "H-#{i}",
    woreda: "Woreda 01",
    city: "Addis Ababa",
    batch_id: Batch.first.id,
    status: 'registered'
  )
  
  pricing = Finance::PricingService.new(student, course, 'standard')
  pricing.calculate_and_create_invoice
  
  print "." if i % 10 == 0
end

puts "\n✅ Created 100 students with invoices"
puts "📊 Total Students: #{Student.count}"
puts "📊 Total Invoices: #{Invoice.count}"
```

---

## Next Steps

1. ✅ Run all tests above
2. ✅ Verify all endpoints work
3. ✅ Check background jobs execute correctly
4. ✅ Test error scenarios (duplicate invoices, invalid data)
5. ✅ Review logs for any errors
6. ✅ Create Pull Request

---

## Support

If you encounter issues:
1. Check Docker logs: `docker-compose logs -f rails-api`
2. Check Rails logs: `docker-compose exec rails-api tail -f log/development.log`
3. Review `FINANCE_MODULE_README.md` for detailed documentation
4. Check Sprint 2 progress: `.kiro/specs/sprint-2-henok/SPRINT_2_PROGRESS.md`

---

**Last Updated**: June 24, 2026  
**Branch**: `henok/pricing-service`  
**Status**: Ready for Testing
