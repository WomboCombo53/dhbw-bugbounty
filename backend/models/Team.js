import mongoose from 'mongoose';

const teamSchema = new mongoose.Schema({
  teamName: { type: String, required: true, unique: true, index: true },
  department: { type: String, required: true },
  description: { type: String, required: true },
  teamleader: { type: String, required: true },
  developers: { type: [String], default: [] },
}, {
  timestamps: true
});

export default mongoose.models.Team || mongoose.model('Team', teamSchema);