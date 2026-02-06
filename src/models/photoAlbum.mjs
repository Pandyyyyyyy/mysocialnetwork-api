import mongoose from 'mongoose';

const Schema = new mongoose.Schema({
  eventId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Event',
    required: true
  },
  name: {
    type: String,
    default: 'Album photos',
    trim: true
  },
  photos: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Photo'
  }],
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  collection: 'photo_albums',
  minimize: false,
  versionKey: false
}).set('toJSON', {
  transform: (doc, ret) => {
    const retUpdated = ret;
    retUpdated.id = ret._id;
    delete retUpdated._id;
    return retUpdated;
  }
});

export default Schema;
