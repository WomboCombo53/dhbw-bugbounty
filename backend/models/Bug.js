import mongoose from 'mongoose';

const bugSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Bug title is required'],
    trim: true,
    maxlength: [200, 'Title cannot exceed 200 characters']
  },
  description: {
    type: String,
    required: [true, 'Description is required'],
    trim: true,
    maxlength: [5000, 'Description cannot exceed 5000 characters']
  },
  severity: {
    type: String,
    required: [true, 'Severity is required'],
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'medium'
  },
  companyName: {
    type: String,
    required: [true, 'Company name is required'],
    trim: true,
    maxlength: [100, 'Company name cannot exceed 100 characters']
  },
  reporterEmail: {
    type: String,
    required: [true, 'Reporter email is required'],
    trim: true,
    lowercase: true,
    match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email address']
  },
  bountyAmount: {
    type: Number,
    min: [0, 'Bounty amount cannot be negative'],
    default: null
  },
  status: {
    type: String,
    enum: ['open', 'in-progress', 'resolved', 'closed', 'rejected'],
    default: 'open'
  },
  submittedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Index for faster queries
bugSchema.index({ severity: 1, submittedAt: -1 });
bugSchema.index({ status: 1 });
bugSchema.index({ companyName: 1 });

const Bug = mongoose.model('Bug', bugSchema);

export default Bug;
