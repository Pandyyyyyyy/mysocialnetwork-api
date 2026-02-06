import mongoose from 'mongoose';

const Schema = new mongoose.Schema({
  groupId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Group',
    default: null
  },
  eventId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Event',
    default: null
  },
  messages: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Message'
  }],
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  collection: 'discussion_threads',
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

Schema.pre('validate', function (next) {
  const hasGroup = !!this.groupId;
  const hasEvent = !!this.eventId;
  if ((hasGroup && hasEvent) || (!hasGroup && !hasEvent)) {
    next(new Error('Un fil de discussion doit être lié à un groupe OU un événement, pas les deux'));
  } else {
    next();
  }
});

export default Schema;
