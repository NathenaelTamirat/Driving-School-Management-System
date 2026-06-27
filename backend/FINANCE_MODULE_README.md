# Finance Module - Ethiopian Driving School Management System

**Sprint 2-3 Implementation** | **Developer**: Henok (Backend Lead) | **Branch**: `henok/pricing-service`

---

## Overview

The Finance Module handles all financial operations for the driving school including:
- Student fee calculation and invoicing
- Milestone-based payment tracking
- Penalty management (attendance breaches, exam failures)
- Instructor payroll calculation

## Architecture

### Core Services

#### 1. PricingService (On-Demand)
**Purpose**: Calculate student fees based on course and pricing tier

**Features**:
- Tier-based pricing (standard/premium/fast_track)
- Upgrade discount logic (30% off when upgrading tiers)
- 50-50 milestone payment split
- Auto-generates registration invoice (Milestone 1)

**Usage**:
```ruby
service = Finance::PricingService.new(student, course, 'standard')
result = service.calculate_and_create_invoice

if result[:success]
  puts "Total Fee: #{result[:total_fee]} ETB"
  puts "Invoice: #{result[:invoice].invoice_number}"
end
```

**Transaction Boundary**: MUST be called within Student registration transaction

---

#### 2. MilestoneTracker (Event-Driven)
**Purpose**: Generate payment invoices when students reach training milestones

**Features**:
- Monitors state transitions (theory_in_progress → practical_in_progress)
- Auto-generates Milestone 2 invoice when eligible
- Guard conditions: mock_test_score > 37 AND milestone_1_paid
- Idempotent (won't create duplicate invoices)

**Usage**:
```ruby
# Called automatically by Student model AASM callback
student.start_practical!  # Triggers MilestoneTracker

# Manual invocation (if needed)
tracker = Finance::MilestoneTracker.new(student)
result = tracker.generate_milestone_2_invoice
```

**Transaction Boundary**: Atomic with state transition (AASM callback)

---

#### 3. PenaltyEngine (Rule-Based)
**Purpose**: Detect rule violations and generate penalty invoices

**Features**:
- Attendance breach detection (7+ days without attendance)
- Exam failure penalties (300 ETB first attempt, 500 ETB second)
- Batch scanning for all active students
- Idempotent per penalty type

**Usage**:
```ruby
# Single student check
engine = Finance::PenaltyEngine.new(student)
result = engine.check_attendance_breach

# Batch scan (called by cron job)
results = Finance::PenaltyEngine.scan_all_for_attendance_breaches
```

**Transaction Boundary**: Independent (idempotent)

---

#### 4. PayrollCalculator (Scheduled)
**Purpose**: Calculate monthly instructor compensation

**Features**:
- Base salary: 15,000 ETB
- Student load bonus: 200 ETB per student
- Performance bonus: 1,000 ETB if pass rate > 80%
- Duplicate detection

**Usage**:
```ruby
# Single instructor
calculator = Finance::PayrollCalculator.new(instructor, month: 6, year: 2024)
result = calculator.calculate_payroll

# Batch calculate (called by cron job)
results = Finance::PayrollCalculator.calculate_all_for_month(month: 6, year: 2024)
```

**Transaction Boundary**: Per-instructor atomic

---

## Background Jobs

### AttendanceBreachScanJob
- **Schedule**: Daily at 2:00 AM (production)
- **Purpose**: Scan all active students for attendance breaches
- **Action**: Generate penalty invoices for 7+ day gaps

### PayrollComputeJob
- **Schedule**: Monthly on 1st at 3:00 AM (production)
- **Purpose**: Calculate previous month's payroll for all instructors
- **Action**: Create PayrollEntry records

**Configuration**: `config/recurring.yml` (Solid Queue)

---

## API Endpoints

### Invoice Management

#### List All Invoices
```http
GET /api/v1/invoices
```

**Query Parameters**:
- `status` - pending/paid/overdue
- `invoice_type` - registration/milestone_1/milestone_2/penalty/exam_fee/upgrade
- `student_id` - Filter by student
- `page` - Page number (pagination)
- `per_page` - Items per page (default: 20)

**Response**:
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "invoice_number": "INV-20260624120000-ABC123",
      "student_id": "uuid",
      "student_name": "John Doe",
      "invoice_type": "milestone_1",
      "amount": 4000.00,
      "status": "pending",
      "due_date": "2026-07-24",
      "paid_at": null,
      "description": "Milestone 1 payment...",
      "is_overdue": false,
      "created_at": "2026-06-24T12:00:00Z"
    }
  ],
  "meta": {
    "current_page": 1,
    "total_pages": 5,
    "total_count": 100,
    "per_page": 20
  }
}
```

---

#### Get Invoice Details
```http
GET /api/v1/invoices/:id
```

---

#### Mark Invoice as Paid
```http
POST /api/v1/invoices/:id/mark_paid
```

**Body**:
```json
{
  "payment_method": "cash",
  "payment_reference": "CASH-001"
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "status": "paid",
    "paid_at": "2026-06-24T15:30:00Z",
    "payment_method": "cash",
    "payment_reference": "CASH-001"
  },
  "message": "Invoice marked as paid successfully"
}
```

---

#### Get Student Invoices
```http
GET /api/v1/students/:student_id/invoices
```

**Query Parameters**:
- `status` - pending/paid/overdue

**Response**:
```json
{
  "success": true,
  "data": [...],
  "meta": {
    "total_pending": 4000.00,
    "total_paid": 4000.00,
    "overdue_count": 0
  }
}
```

---

## Database Schema

### Courses Table
```ruby
- name: string
- description: text
- course_code: string (unique)
- standard_price: decimal
- premium_price: decimal
- fast_track_price: decimal
- duration_weeks: integer
- theory_hours: integer
- practical_hours: integer
```

### Invoices Table
```ruby
- student_id: uuid (foreign key)
- invoice_number: string (unique, auto-generated)
- invoice_type: string (registration/milestone_1/milestone_2/penalty/exam_fee/upgrade)
- amount: decimal
- status: string (pending/paid/overdue/cancelled)
- due_date: date
- paid_date: date
- payment_method: string
- payment_reference: string
- description: text
- metadata: jsonb
```

### PayrollEntries Table
```ruby
- instructor_id: uuid (foreign key to users)
- payroll_month: date
- base_salary: decimal
- student_count: integer
- student_load_bonus: decimal
- performance_bonus: decimal
- total_amount: decimal
- payment_status: string (pending/paid/cancelled)
- payment_date: date
- payment_method: string
- payment_reference: string
```

### Students Table (Added Fields)
```ruby
- pricing_tier: string (standard/premium/fast_track)
- total_fee: decimal
- amount_paid: decimal
- milestone_1_paid: boolean
- milestone_2_paid: boolean
```

---

## Setup & Deployment

### 1. Install Dependencies
```bash
docker-compose exec rails-api bundle install
```

### 2. Run Migrations
```bash
docker-compose exec rails-api rails db:migrate
```

### 3. Seed Course Data
```bash
docker-compose exec rails-api rails db:seed
```

### 4. Verify Setup
```bash
# Check migrations
docker-compose exec rails-api rails db:migrate:status

# Check courses
docker-compose exec rails-api rails console
> Course.count  # Should be 3
```

---

## Testing

### Manual Testing (Rails Console)

#### Test PricingService
```ruby
course = Course.first
batch = Batch.first

student = Student.new(
  student_id: "TEST-001",
  document_id: "DOC-001",
  first_name: "Test",
  middle_name: "Student",
  last_name: "Demo",
  date_of_birth: 20.years.ago,
  blood_type: "O+",
  address: "Test Address",
  house_number: "123",
  woreda: "Woreda 01",
  city: "Addis Ababa",
  batch_id: batch.id,
  status: 'registered'
)

pricing = Finance::PricingService.new(student, course, 'standard')
result = pricing.calculate_and_create_invoice

puts "Success: #{result[:success]}"
puts "Total Fee: #{result[:total_fee]} ETB"
puts "Invoice: #{result[:invoice].invoice_number}"
```

#### Test MilestoneTracker
```ruby
student = Student.find_by(student_id: "TEST-001")
student.update(
  theory_days_completed: 35,
  mock_test_score: 40,
  milestone_1_paid: true
)

student.start_theory!
student.start_practical!  # Should auto-generate Milestone 2 invoice

# Verify
milestone_2_invoice = student.invoices.find_by(invoice_type: 'milestone_2')
puts "Milestone 2 Invoice: #{milestone_2_invoice.invoice_number}"
puts "Amount: #{milestone_2_invoice.amount} ETB"
```

#### Test PenaltyEngine
```ruby
student = Student.find_by(student_id: "TEST-001")
engine = Finance::PenaltyEngine.new(student)

# Test attendance breach
result = engine.check_attendance_breach
puts "Breach detected: #{result[:success]}"

# Test batch scan
results = Finance::PenaltyEngine.scan_all_for_attendance_breaches
puts "Scanned: #{results[:scanned]} students"
puts "Penalties created: #{results[:penalties_created]}"
```

#### Test PayrollCalculator
```ruby
instructor = User.instructors.first
calculator = Finance::PayrollCalculator.new(instructor, month: 6, year: 2024)
result = calculator.calculate_payroll

puts "Success: #{result[:success]}"
puts "Base Salary: #{result[:breakdown][:base_salary]} ETB"
puts "Total: #{result[:breakdown][:total_salary]} ETB"
```

### API Testing (curl)

```bash
# Get auth token
TOKEN=$(curl -s -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"password"}' \
  | jq -r '.token')

# List invoices
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:3000/api/v1/invoices | jq

# Get student invoices
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:3000/api/v1/students/STUDENT_ID/invoices | jq

# Mark invoice as paid
curl -X POST -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"payment_method":"cash","payment_reference":"CASH-001"}' \
  http://localhost:3000/api/v1/invoices/INVOICE_ID/mark_paid | jq
```

---

## Error Handling

All services return a consistent result hash:

```ruby
{
  success: true/false,
  data: <resource> or nil,
  errors: [],
  message: "Optional message"
}
```

### Common Error Scenarios

1. **Duplicate Invoice**: MilestoneTracker won't create duplicate milestone invoices
2. **Ineligible Milestone**: Guards prevent premature invoice generation
3. **Invalid Payment**: Invoice already paid, cannot mark as paid again
4. **Duplicate Payroll**: PayrollCalculator detects existing entries for the month

---

## Monitoring & Logging

All services log important events:

```ruby
# Success events
Rails.logger.info "Generated Milestone 2 invoice #INV-123 for Student #456"

# Warning events  
Rails.logger.warn "Milestone 2 invoice generation failed: Milestone 1 not paid"

# Error events
Rails.logger.error "Payroll calculation error: #{exception.message}"
```

---

## Future Enhancements

1. **Payment Gateway Integration**: Chapa, Telebirr, etc.
2. **SMS/Email Notifications**: Invoice reminders, payment confirmations
3. **Financial Reports**: Revenue, outstanding payments, payroll summaries
4. **Discount System**: Promotional discounts, early payment incentives
5. **Refund Management**: Handle refund scenarios
6. **Expense Tracking**: School operational expenses

---

## Support & Contact

**Developer**: Henok (Backend Lead)  
**Sprint**: Week 2-3 - Finance Module  
**Documentation**: See Obsidian vault at `/Users/henok/Documents/Advanced_p/Advanced_programing_Drivers_school/Wiki file/Finance Module.md`

---

**Last Updated**: June 24, 2026
