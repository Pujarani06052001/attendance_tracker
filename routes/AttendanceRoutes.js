import express from 'express';
import mongoose from 'mongoose';
import Attendance from '../schemas/AttendanceSchemas.js';
import Class from '../schemas/ClassSchemas.js';

const router = express.Router();

// Add Attendance
router.post('/add/:classId', async (req, res) => {
  const { students } = req.body;
  const { classId } = req.params;

  try {
    const trimmedClassId = classId.trim();
    const attendanceDate = new Date().toISOString().split('T')[0];

    const classData = await Class.findById(trimmedClassId).select('students');
    if (!classData) {
      return res.status(404).json({ message: 'Class not found' });
    }

    const allStudents = classData.students.map((student) => student.toString());
    let attendance = await Attendance.findOne({
      class: trimmedClassId,
      date: attendanceDate,
    });

    if (!attendance) {
      const presentStudents = students.map((studentId) => ({
        studentId,
        status: 'present',
      }));

      const absentStudents = allStudents
        .filter((studentId) => !students.includes(studentId))
        .map((studentId) => ({
          studentId,
          status: 'absent',
        }));

      const allAttendance = [...presentStudents, ...absentStudents];

      attendance = new Attendance({
        class: trimmedClassId,
        date: attendanceDate,
        students: allAttendance,
      });

      await attendance.save();

      return res.status(201).json({
        message: 'New attendance record created successfully',
        attendance,
      });
    } else {
      // Update existing attendance
      const newStudents = students.map((studentId) => {
        const existingStudent = attendance.students.find(
          (student) => student.studentId.toString() === studentId
        );
        if (existingStudent) return null; // Skip if already present
        return { studentId, status: 'present' };
      });

      const absentStudents = allStudents
        .filter(
          (studentId) =>
            !students.includes(studentId) &&
            !attendance.students.some((s) => s.studentId.toString() === studentId)
        )
        .map((studentId) => ({ studentId, status: 'absent' }));

      attendance.students.push(...newStudents.filter(Boolean), ...absentStudents);
      await attendance.save();

      return res.status(200).json({ message: 'Attendance updated successfully', attendance });
    }
  } catch (error) {
    res.status(500).json({ error: 'Failed to add/update attendance', details: error.message });
  }
});

// Get Attendance for a Class
router.get('/class/:classId', async (req, res) => {
  const { classId } = req.params;

  try {
    const attendance = await Attendance.find({ class: classId })
      .populate('students.studentId', 'name')
      .populate('class', 'name');
    if (!attendance || attendance.length === 0) {
      return res.status(404).json({ message: 'No attendance records found for this class' });
    }

    const result = attendance.map((record) => ({
      date: record.date,
      presentStudents: record.students.filter((s) => s.status === 'present'),
      absentStudents: record.students.filter((s) => s.status === 'absent'),
    }));

    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch attendance data for the class', details: error.message });
  }
});

// Get Attendance for a Student
router.get('/student/:studentId', async (req, res) => {
  const { studentId } = req.params;

  try {
    const attendance = await Attendance.find({ 'students.studentId': studentId })
      .populate('class', 'name');
    if (!attendance || attendance.length === 0) {
      return res.status(404).json({ message: 'No attendance records found for this student' });
    }

    res.status(200).json(attendance);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch attendance data for the student', details: error.message });
  }
});

// Get All Attendance Records
router.get('/all', async (req, res) => {
  try {
    const allAttendance = await Attendance.find()
      .populate('students.studentId', 'name')
      .populate('class', 'name');

    const result = allAttendance.map((record) => ({
      className: record.class ? record.class.name : 'Class not found', // Handle null class
      date: record.date,
      presentStudents: record.students.filter((s) => s.status === 'present'),
      absentStudents: record.students.filter((s) => s.status === 'absent'),
    }));

    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch all attendance records', details: error.message });
  }
});


// Update Attendance Record
router.put('/update/:attendanceId', async (req, res) => {
  const { attendanceId } = req.params;
  const { studentId, status } = req.body;

  try {
    const attendance = await Attendance.findById(attendanceId);
    if (!attendance) {
      return res.status(404).json({ message: 'Attendance record not found' });
    }

    const studentRecord = attendance.students.find(
      (s) => s.studentId.toString() === studentId
    );
    if (studentRecord) {
      studentRecord.status = status;
      await attendance.save();
      return res.status(200).json({ message: 'Attendance updated successfully', attendance });
    } else {
      return res.status(404).json({ message: 'Student not found in this attendance record' });
    }
  } catch (error) {
    res.status(500).json({ error: 'Failed to update attendance', details: error.message });
  }
});

// Delete Attendance Record
router.delete('/delete/:attendanceId', async (req, res) => {
  const { attendanceId } = req.params;

  try {
    const attendance = await Attendance.findByIdAndDelete(attendanceId);
    if (!attendance) {
      return res.status(404).json({ message: 'Attendance record not found' });
    }
    res.status(200).json({ message: 'Attendance deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete attendance', details: error.message });
  }
});

export default router;
