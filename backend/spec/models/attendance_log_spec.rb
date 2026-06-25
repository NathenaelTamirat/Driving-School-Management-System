require "rails_helper"

RSpec.describe AttendanceLog, type: :model do
  include ActiveSupport::Testing::TimeHelpers

  let(:student) { create(:student) }

  describe "associations" do
    it { should belong_to(:student) }
  end

  describe "validations — phase" do
    it "is invalid without a phase" do
      log = build(:attendance_log, student: student, phase: nil)
      expect(log).not_to be_valid
      expect(log.errors[:phase]).to include("can't be blank")
    end

    it "is invalid with an unrecognised phase" do
      log = build(:attendance_log, student: student, phase: "driving")
      expect(log).not_to be_valid
      expect(log.errors[:phase]).to include("must be 'theory' or 'practical'")
    end

    it "is valid with phase 'theory'" do
      log = build(:attendance_log, student: student, phase: "theory")
      expect(log).to be_valid
    end

    it "is valid with phase 'practical'" do
      log = build(:attendance_log, :practical, student: student)
      expect(log).to be_valid
    end
  end

  describe "validations — attendance_date" do
    it "is invalid without an attendance_date" do
      log = build(:attendance_log, student: student, attendance_date: nil)
      expect(log).not_to be_valid
      expect(log.errors[:attendance_date]).to include("can't be blank")
    end
  end

  describe "uniqueness per student, phase, and date" do
    let(:today) { Date.today }

    it "rejects a duplicate log for the same student, phase, and date" do
      create(:attendance_log, student: student, phase: "theory", attendance_date: today)
      duplicate = build(:attendance_log, student: student, phase: "theory", attendance_date: today)

      expect(duplicate).not_to be_valid
      expect(duplicate.errors[:attendance_date]).to be_present
    end

    it "allows the same date for a different phase" do
      create(:attendance_log, student: student, phase: "theory",    attendance_date: today)
      other_phase = build(:attendance_log, student: student, phase: "practical", attendance_date: today)

      expect(other_phase).to be_valid
    end

    it "allows the same student + phase for a different date" do
      create(:attendance_log, student: student, phase: "theory", attendance_date: today)
      next_day = build(:attendance_log, student: student, phase: "theory", attendance_date: today - 1)

      expect(next_day).to be_valid
    end

    it "allows the same phase and date for a different student" do
      other_student = create(:student)
      create(:attendance_log, student: student,       phase: "theory", attendance_date: today)
      other_log = build(:attendance_log,  student: other_student, phase: "theory", attendance_date: today)

      expect(other_log).to be_valid
    end
  end

  describe "scopes" do
    before do
      create(:attendance_log, student: student, phase: "theory",    present: true,  attendance_date: 3.days.ago.to_date)
      create(:attendance_log, student: student, phase: "theory",    present: false, attendance_date: 2.days.ago.to_date)
      create(:attendance_log, student: student, phase: "practical", present: true,  attendance_date: 1.day.ago.to_date)
    end

    it ".present returns only logs where student was present" do
      expect(AttendanceLog.present.count).to eq(2)
    end

    it ".for_phase('theory') returns only theory logs" do
      expect(AttendanceLog.for_phase("theory").count).to eq(2)
    end

    it ".for_phase('practical') returns only practical logs" do
      expect(AttendanceLog.for_phase("practical").count).to eq(1)
    end

    it ".on_date returns only logs for the given date" do
      expect(AttendanceLog.on_date(3.days.ago.to_date).count).to eq(1)
    end

    it ".locked returns only manually-locked logs" do
      create(:attendance_log, :manually_locked, student: student, attendance_date: 4.days.ago.to_date)
      expect(AttendanceLog.locked.count).to eq(1)
    end

    it ".unlocked excludes manually-locked logs" do
      create(:attendance_log, :manually_locked, student: student, attendance_date: 4.days.ago.to_date)
      expect(AttendanceLog.unlocked.count).to eq(3)
    end
  end

  describe "24-hour lock" do
    describe "#lockable?" do
      it "returns false for a log just created" do
        log = create(:attendance_log, student: student)
        expect(log.lockable?).to be false
      end

      it "returns true for a log created more than 24 hours ago" do
        log = travel_to(25.hours.ago) { create(:attendance_log, student: student) }
        expect(log.lockable?).to be true
      end

      it "returns true when the log has been manually locked" do
        log = create(:attendance_log, :manually_locked, student: student)
        expect(log.lockable?).to be true
      end
    end

    it "allows updating a log still within the 24-hour window" do
      log = create(:attendance_log, student: student)
      expect(log.update(notes: "corrected")).to be true
    end

    it "rejects updates once the 24-hour window has passed" do
      log = travel_to(25.hours.ago) { create(:attendance_log, student: student) }

      expect(log.update(notes: "too late")).to be false
      expect(log.errors[:base]).to include("Attendance log is locked and cannot be edited after 24 hours")
    end

    it "rejects updates on a manually locked log regardless of age" do
      log = create(:attendance_log, :manually_locked, student: student)

      expect(log.update(notes: "blocked")).to be false
      expect(log.errors[:base]).to include("Attendance log is locked and cannot be edited after 24 hours")
    end

    it "does not block creating a new log" do
      expect { create(:attendance_log, student: student) }.not_to raise_error
    end
  end
end
