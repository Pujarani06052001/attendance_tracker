
import express from 'express';
import mongoose from 'mongoose';
import Class from '../schemas/ClassSchemas.js';  

const router = express.Router();



router.get('/all', async (req, res) => {
  console.log("In valid route");
  try {
    const classes = await Class.find()
      .populate('teacher', 'name')
      .populate('students', 'name');

    console.log("Fetched classes:", classes);

    if (!classes.length) {
      console.warn('No classes found');
      return res.status(200).json([]); 
    }

    res.status(200).json(classes);
  } catch (error) {
    console.error('Error fetching all classes:', error);
    res.status(500).json({ error: 'Failed to fetch all classes', details: error.message });
  }
});

router.post('/add', async (req, res) => {
  const { name, description, time, teacherId, students } = req.body;

  try {
    
    const teacherObjectId = new mongoose.Types.ObjectId(teacherId);

    const newClass = new Class({
      name,
      description,
      time,
      teacher: teacherObjectId,
      students,  
    });

    const savedClass = await newClass.save();

    res.status(201).json({
      message: 'Class created successfully',
      class: {
        name: savedClass.name,
        description: savedClass.description,
        time: savedClass.time,
        students: savedClass.students.map(student => student.toString()), 
        teacher: savedClass.teacher.toString(),  
        _id: savedClass._id.toString(),  
        __v: savedClass.__v
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to create class', details: error.message });
  }
});


router.get('/teacher/classes', async (req, res) => {
  try {
      const classes = await Class.find()
          .populate('teacher', 'name')
          .populate('students', 'name'); 

      console.log('Fetched classes:', classes);

      const groupedClasses = classes.reduce((acc, currentClass) => {
          if (!currentClass.teacher) {
              console.warn('Teacher not found for class:', currentClass);
              return acc; 
          }

          const teacherId = currentClass.teacher._id.toString();
          if (!acc[teacherId]) {
              acc[teacherId] = {
                  teacher: currentClass.teacher.name,
                  classes: []
              };
          }

          acc[teacherId].classes.push({
              _id: currentClass._id,
              name: currentClass.name,
              description: currentClass.description,
              time: currentClass.time
          });
          return acc;
      }, {});

      res.status(200).json(groupedClasses);
  } catch (error) {
      console.error('Error fetching classes by teacher:', error);
      res.status(500).json({ error: 'Failed to fetch classes', details: error.message });
  }
});


router.put('/update/:id', async (req, res) => {
  const { id } = req.params;
  const { name, description, time, teacherId, students } = req.body;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ message: 'Invalid class ID' });
  }

  try {
    const updateFields = {}; 

    if (name) updateFields.name = name;
    if (description) updateFields.description = description;
    if (time) updateFields.time = time;

    if (teacherId) {
      if (!mongoose.Types.ObjectId.isValid(teacherId)) {
        return res.status(400).json({ message: 'Invalid teacher ID' });
      }
      updateFields.teacher = new mongoose.Types.ObjectId(teacherId);
    }

    if (students) {
      if (!Array.isArray(students.add) || !Array.isArray(students.remove)) {
        return res.status(400).json({ message: 'Invalid students data' });
      }

      if (students.add.length > 0) {
        updateFields.$addToSet = { students: { $each: students.add } };
      }


      if (students.remove.length > 0) {
        updateFields.$pull = { students: { $in: students.remove } };
      }
    }

    if (Object.keys(updateFields).length === 0) {
      return res.status(400).json({ message: 'No valid fields provided for update' });
    }

    const updatedClass = await Class.findByIdAndUpdate(
      id,
      updateFields, 
      { new: true, runValidators: true }
    );

    if (!updatedClass) {
      return res.status(404).json({ message: 'Class not found' });
    }

    res.status(200).json({ message: 'Class updated successfully', class: updatedClass });
  } catch (error) {
    console.error('Error updating class:', error);
    res.status(500).json({ error: 'Failed to update class', details: error.message });
  }
});




 


router.delete('/delete/:id', async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ message: 'Invalid class ID' });
  }

  try {
    const deletedClass = await Class.findByIdAndDelete(id);

    if (!deletedClass) {
      return res.status(404).json({ message: 'Class not found' });
    }

    res.status(200).json({ message: 'Class deleted successfully', class: deletedClass });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete class', details: error.message })
  }
});

export default router;
