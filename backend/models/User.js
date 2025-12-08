import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  googleId: { type: String, required: true, unique: true, index: true },
  role: { type: String, enum: ['reporter', 'admin', 'developer'], default: 'reporter' },
  lastSeen: { type: Date, default: Date.now }
}, {
  timestamps: true
});

export default mongoose.models.User || mongoose.model('User', userSchema);