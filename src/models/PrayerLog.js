const { Schema, model } = require('mongoose');

const prayerLogSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    date: { type: String, required: true, index: true },
    prayers: {
      bomdod: { type: Boolean, default: false },
      peshin: { type: Boolean, default: false },
      asr: { type: Boolean, default: false },
      shom: { type: Boolean, default: false },
      xufton: { type: Boolean, default: false }
    },
    isClosed: { type: Boolean, default: false }
  },
  {
    timestamps: false,
    versionKey: false
  }
);

prayerLogSchema.index({ userId: 1, date: 1 }, { unique: true });

module.exports = model('PrayerLog', prayerLogSchema);
