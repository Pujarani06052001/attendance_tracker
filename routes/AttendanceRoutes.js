import express from 'express';
import mongoose from 'mongoose';
import Attendance from '../schemas/AttendanceSchemas.js';
import Class from '../schemas/ClassSchemas.js';  

const router = express.Router();


router.post('/add/:classId', async (req, res) => {
  const { students } = req.body; 
  const { classId } = req.params;


  const trimmedClassId = classId.trim();

  try {
    const attendanceDate = new Date().toISOString().split('T')[0];

    // Fetch the list of all students in the class from the database
    const classData = await Class.findById(trimmedClassId).select('students');
    console.log(classData);
    
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
      const newStudents = students.map((studentId) => {
        const existingStudent = attendance.students.find(
          (student) => student.studentId === studentId
        );

        if (existingStudent) {
          return null;
        }

        return {
          studentId: studentId,
          status: 'present',
        };
      });

      const absentStudents = allStudents
        .filter(
          (studentId) =>
            !students.includes(studentId) &&
            !attendance.students.some((s) => s.studentId === studentId)
        )
        .map((studentId) => ({
          studentId,
          status: 'absent',
        }));

      attendance.students.push(...newStudents.filter(Boolean), ...absentStudents);
      await attendance.save();

      res.status(201).json({ message: 'Attendance updated successfully', attendance });
    }
  } catch (error) {
    res.status(500).json({ error: 'Failed to add attendance', details: error.message });
  }
});



router.get('/class/:classId', async (req, res) => {
  const { classId } = req.params;

  try {
    const attendance = await Attendance.find({ class: classId })
      .populate('student', 'name') 
      .populate('class', 'name'); 
    res.status(200).json(attendance);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get attendance for the class', details: error });
  }
});

router.get('/student/:studentId', async (req, res) => {
  const { studentId } = req.params;

  try {
    const attendance = await Attendance.find({ student: studentId })
      .populate('class', 'name'); 
    res.status(200).json(attendance);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get attendance for the student', details: error });
  }
});


router.put('/update/:attendanceId', async (req, res) => {
  const { attendanceId } = req.params;
  const { status } = req.body;

  try {
    const attendance = await Attendance.findByIdAndUpdate(
      attendanceId,
      { status },
      { new: true }
    );
    if (!attendance) {
      return res.status(404).json({ message: 'Attendance record not found' });
    }
    res.status(200).json({ message: 'Attendance status updated', attendance });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update attendance', details: error });
  }
});


router.delete('/delete/:attendanceId', async (req, res) => {
  const { attendanceId } = req.params;

  try {
    const attendance = await Attendance.findByIdAndDelete(attendanceId);
    if (!attendance) {
      return res.status(404).json({ message: 'Attendance record not found' });
    }
    res.status(200).json({ message: 'Attendance deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete attendance', details: error });
  }
});

export default router;
