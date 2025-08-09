import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  twitchId: {
    type: String,
    required: true,
    unique: true
  },
  login: {
    type: String,
    required: true
  },
  displayName: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true
  },
  profileImageUrl: {
    type: String
  },
  accessToken: {
    type: String,
    required: true
  },
  refreshToken: {
    type: String,
    required: true
  },
  tokenExpiresAt: {
    type: Date
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  lastLoginAt: {
    type: Date,
    default: Date.now
  }
});

// Index for faster queries
userSchema.index({ twitchId: 1 });
userSchema.index({ login: 1 });

export default mongoose.model('User', userSchema);
