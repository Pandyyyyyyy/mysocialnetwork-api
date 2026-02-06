import EventModel from '../models/event.mjs';
import PhotoAlbumModel from '../models/photoAlbum.mjs';
import DiscussionThreadModel from '../models/discussionThread.mjs';
import { handleValidationErrors, eventCreateValidator, eventUpdateValidator } from '../validators/index.mjs';
import { authenticateToken } from './auth.mjs';

const Events = class Events {
  constructor(app, connect) {
    this.app = app;
    this.EventModel = connect.model('Event', EventModel);
    this.PhotoAlbumModel = connect.model('PhotoAlbum', PhotoAlbumModel);
    this.DiscussionThreadModel = connect.model('DiscussionThread', DiscussionThreadModel);
    this.run();
  }

  create() {
    this.app.post(
      '/events',
      authenticateToken,
      eventCreateValidator,
      handleValidationErrors,
      async (req, res) => {
        try {
          const event = new this.EventModel(req.body);
          await event.save();
          const thread = new this.DiscussionThreadModel({
            eventId: event._id
          });
          await thread.save();
          const album = new this.PhotoAlbumModel({
            eventId: event._id
          });
          await album.save();
          res.status(201).json(event);
        } catch (err) {
          console.error('[ERROR] events/create ->', err);
          res.status(500).json({ code: 500, message: 'Erreur serveur' });
        }
      }
    );
  }

  findAll() {
    this.app.get('/events', async (req, res) => {
      try {
        const events = await this.EventModel.find(req.query)
          .populate('organizers', 'firstname lastname email avatar')
          .populate('participants', 'firstname lastname email avatar');
        res.status(200).json(events);
      } catch (err) {
        console.error('[ERROR] GET /events ->', err);
        res.status(500).json({ code: 500, message: 'Erreur serveur' });
      }
    });
  }

  showById() {
    this.app.get('/events/:id', async (req, res) => {
      try {
        const event = await this.EventModel.findById(req.params.id)
          .populate('organizers', 'firstname lastname email avatar')
          .populate('participants', 'firstname lastname email avatar');
        if (!event) {
          return res.status(404).json({ code: 404, message: 'Événement non trouvé' });
        }
        res.status(200).json(event);
      } catch (err) {
        console.error('[ERROR] events/:id ->', err);
        res.status(500).json({ code: 500, message: 'Erreur serveur' });
      }
    });
  }

  update() {
    this.app.put(
      '/events/:id',
      authenticateToken,
      eventUpdateValidator,
      handleValidationErrors,
      async (req, res) => {
        try {
          const event = await this.EventModel.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true }
          );
          if (!event) {
            return res.status(404).json({ code: 404, message: 'Événement non trouvé' });
          }
          res.status(200).json(event);
        } catch (err) {
          console.error('[ERROR] PUT /events/:id ->', err);
          res.status(500).json({ code: 500, message: 'Erreur serveur' });
        }
      }
    );
  }

  addParticipant() {
    this.app.post(
      '/events/:id/participants',
      authenticateToken,
      async (req, res) => {
        try {
          const { userId } = req.body;
          const event = await this.EventModel.findByIdAndUpdate(
            req.params.id,
            { $addToSet: { participants: userId } },
            { new: true }
          );
          if (!event) {
            return res.status(404).json({ code: 404, message: 'Événement non trouvé' });
          }
          res.status(200).json(event);
        } catch (err) {
          console.error('[ERROR] events/:id/participants ->', err);
          res.status(500).json({ code: 500, message: 'Erreur serveur' });
        }
      }
    );
  }

  run() {
    this.create();
    this.findAll();
    this.showById();
    this.update();
    this.addParticipant();
  }
};

export default Events;
