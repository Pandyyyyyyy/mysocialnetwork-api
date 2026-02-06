import mongoose from 'mongoose';

const Schema = new mongoose.Schema({
  ticketTypeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'TicketType',
    required: true
  },
  eventId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Event',
    required: true
  },
  buyerEmail: {
    type: String,
    required: true,
    lowercase: true,
    trim: true
  },
  firstName: {
    type: String,
    required: true,
    trim: true
  },
  lastName: {
    type: String,
    required: true,
    trim: true
  },
  address: {
    type: String,
    required: true,
    trim: true
  },
  purchaseDate: {
    type: Date,
    default: Date.now
  }
}, {
  collection: 'tickets',
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
