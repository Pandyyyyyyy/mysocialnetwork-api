import CarpoolModel from '../models/carpool.mjs';
import EventModel from '../models/event.mjs';
import { handleValidationErrors, carpoolCreateValidator } from '../validators/index.mjs';
import { authenticateToken } from './auth.mjs';

const Carpool = class Carpool {
  constructor(app, connect) {
    this.app = app;
    this.CarpoolModel = connect.model('Carpool', CarpoolModel);
    this.EventModel = connect.model('Event', EventModel);
    this.run();
  }

  create() {
    this.app.post(
      '/events/:eventId/carpools',
      authenticateToken,
      (req, res, next) => {
        req.body.eventId = req.params.eventId;
        next();
      },
      carpoolCreateValidator,
      handleValidationErrors,
      async (req, res) => {
        try {
          const { eventId } = req.params;
          const event = await this.EventModel.findById(eventId);
          if (!event) {
            return res.status(404).json({ code: 404, message: 'Événement non trouvé' });
          }
          if (!event.carpoolEnabled) {
            return res.status(400).json({
              code: 400,
              message: 'Le covoiturage n\'est pas activé pour cet événement'
            });
          }
          const isParticipant = event.participants.some(
            p => p.toString() === req.user.id || p._id?.toString() === req.user.id
          );
          if (!isParticipant) {
            return res.status(403).json({ code: 403, message: 'Seuls les participants peuvent proposer un covoiturage' });
          }
          const carpool = new this.CarpoolModel({
            ...req.body,
            eventId,
            driver: req.user.id
          });
          await carpool.save();
          const populated = await this.CarpoolModel.findById(carpool._id)
            .populate('driver', 'firstname lastname');
          res.status(201).json(populated);
        } catch (err) {
          console.error('[ERROR] carpools/create ->', err);
          res.status(500).json({ code: 500, message: 'Erreur serveur' });
        }
      }
    );
  }

  getByEvent() {
    this.app.get('/events/:eventId/carpools', async (req, res) => {
      try {
        const carpools = await this.CarpoolModel.find({ eventId: req.params.eventId })
          .populate('driver', 'firstname lastname')
          .populate('passengers', 'firstname lastname');
        res.status(200).json(carpools);
      } catch (err) {
        console.error('[ERROR] events/:eventId/carpools ->', err);
        res.status(500).json({ code: 500, message: 'Erreur serveur' });
      }
    });
  }

  join() {
    this.app.post(
      '/carpools/:id/join',
      authenticateToken,
      async (req, res) => {
        try {
          const carpool = await this.CarpoolModel.findById(req.params.id);
          if (!carpool) {
            return res.status(404).json({ code: 404, message: 'Covoiturage non trouvé' });
          }
          if (carpool.passengers.length >= carpool.availableSeats) {
            return res.status(400).json({ code: 400, message: 'Plus de places disponibles' });
          }
          if (carpool.driver.toString() === req.user.id) {
            return res.status(400).json({ code: 400, message: 'Vous êtes déjà le conducteur' });
          }
          if (carpool.passengers.some(p => p.toString() === req.user.id)) {
            return res.status(400).json({ code: 400, message: 'Vous avez déjà rejoint ce covoiturage' });
          }
          carpool.passengers.push(req.user.id);
          await carpool.save();
          const populated = await this.CarpoolModel.findById(carpool._id)
            .populate('driver', 'firstname lastname')
            .populate('passengers', 'firstname lastname');
          res.status(200).json(populated);
        } catch (err) {
          console.error('[ERROR] carpools/join ->', err);
          res.status(500).json({ code: 500, message: 'Erreur serveur' });
        }
      }
    );
  }

  run() {
    this.create();
    this.getByEvent();
    this.join();
  }
};

export default Carpool;
