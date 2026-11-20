import mongoose from 'mongoose';

// Simple schema: every field is optional so the API tests can cover partial updates.
const ContactSchema = new mongoose.Schema({
  firstname: String,
  lastname: String,
  email: String
});

export default mongoose.model('Contact', ContactSchema, 'contacts');
