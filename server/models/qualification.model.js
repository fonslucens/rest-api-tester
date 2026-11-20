import mongoose from 'mongoose';

// Simple schema: every field is optional so the API tests can cover partial updates.
const QualificationSchema = new mongoose.Schema({
  title: String,
  firstname: String,
  lastname: String,
  email: String,
  completion: Date,
  description: String
});

export default mongoose.model('Qualification', QualificationSchema, 'qualifications');
