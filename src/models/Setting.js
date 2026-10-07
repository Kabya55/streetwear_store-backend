import mongoose from 'mongoose';

const settingSchema = new mongoose.Schema(
  {
    key: {
      type: String,
      default: 'store_settings',
      unique: true,
    },
    deliveryCharge: {
      type: Number,
      required: true,
      default: 120,
      min: 0,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model('Setting', settingSchema);
