import mongoose from 'mongoose';
const { Schema } = mongoose;

const ClassSchema = new Schema({
  name: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  time: {
    type: String,
    required: true,
  },
  students: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  }],
  teacher: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  // studentCount: {
  //   type: [Number], 
  //   default: [], 
  // },
});

const Class = mongoose.model('Class', ClassSchema);
export default Class;
