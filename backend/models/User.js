import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  googleId: { type: String, required: true, unique: true, index: true },
  name: { type: String, required: true },
  role: { type: String, enum: ['reporter', 'admin', 'developer'], default: 'reporter'},
  email: { type: String, required: true, unique: true },
  lastSeen: { type: Date, default: Date.now }
}, {
  timestamps: true
});

export default mongoose.models.User || mongoose.model('User', userSchema);