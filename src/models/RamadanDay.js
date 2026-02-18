const { Schema, model } = require('mongoose');

const ramadanDaySchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    date: { type: String, required: true, index: true },
    dayNumber: { type: Number, required: true },
    status: {
      type: String,
      enum: ['pending', 'completed', 'missed'],
      default: 'pending'
    }
  },
  {
    timestamps: false,
    versionKey: false
  }
);

ramadanDaySchema.index({ userId: 1, date: 1 }, { unique: true });

module.exports = model('RamadanDay', ramadanDaySchema);
