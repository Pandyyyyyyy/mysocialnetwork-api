import PollModel from '../models/poll.mjs';
import EventModel from '../models/event.mjs';
import { handleValidationErrors, pollCreateValidator, pollVoteValidator } from '../validators/index.mjs';
import { authenticateToken } from './auth.mjs';

const Polls = class Polls {
  constructor(app, connect) {
    this.app = app;
    this.PollModel = connect.model('Poll', PollModel);
    this.EventModel = connect.model('Event', EventModel);
    this.run();
  }

  create() {
    this.app.post(
      '/polls',
      authenticateToken,
      pollCreateValidator,
      handleValidationErrors,
      async (req, res) => {
        try {
          const event = await this.EventModel.findById(req.body.eventId);
          if (!event) {
            return res.status(404).json({ code: 404, message: 'Événement non trouvé' });
          }
          const isOrganizer = event.organizers.some(
            o => o.toString() === req.user.id || o._id?.toString() === req.user.id
          );
          if (!isOrganizer) {
            return res.status(403).json({ code: 403, message: 'Seuls les organisateurs peuvent créer des sondages' });
          }
          const poll = new this.PollModel({
            ...req.body,
            createdBy: req.user.id
          });
          await poll.save();
          res.status(201).json(poll);
        } catch (err) {
          console.error('[ERROR] polls/create ->', err);
          res.status(500).json({ code: 500, message: 'Erreur serveur' });
        }
      }
    );
  }

  showById() {
    this.app.get('/polls/:id', async (req, res) => {
      try {
        const poll = await this.PollModel.findById(req.params.id)
          .populate('createdBy', 'firstname lastname');
        if (!poll) {
          return res.status(404).json({ code: 404, message: 'Sondage non trouvé' });
        }
        res.status(200).json(poll);
      } catch (err) {
        console.error('[ERROR] polls/:id ->', err);
        res.status(500).json({ code: 500, message: 'Erreur serveur' });
      }
    });
  }

  getByEvent() {
    this.app.get('/events/:eventId/polls', async (req, res) => {
      try {
        const polls = await this.PollModel.find({ eventId: req.params.eventId })
          .populate('createdBy', 'firstname lastname');
        res.status(200).json(polls);
      } catch (err) {
        console.error('[ERROR] events/:eventId/polls ->', err);
        res.status(500).json({ code: 500, message: 'Erreur serveur' });
      }
    });
  }

  vote() {
    this.app.post(
      '/polls/:id/vote',
      authenticateToken,
      pollVoteValidator,
      handleValidationErrors,
      async (req, res) => {
        try {
          const poll = await this.PollModel.findById(req.params.id);
          if (!poll) {
            return res.status(404).json({ code: 404, message: 'Sondage non trouvé' });
          }
          const event = await this.EventModel.findById(poll.eventId);
          const isParticipant = event.participants.some(
            p => p.toString() === req.user.id || p._id?.toString() === req.user.id
          );
          if (!isParticipant) {
            return res.status(403).json({ code: 403, message: 'Seuls les participants peuvent voter' });
          }
          const alreadyVoted = poll.responses.some(
            r => r.participant.toString() === req.user.id
          );
          if (alreadyVoted) {
            return res.status(400).json({ code: 400, message: 'Vous avez déjà voté' });
          }
          poll.responses.push({
            participant: req.user.id,
            answers: req.body.answers
          });
          await poll.save();
          res.status(200).json(poll);
        } catch (err) {
          console.error('[ERROR] polls/vote ->', err);
          res.status(500).json({ code: 500, message: 'Erreur serveur' });
        }
      }
    );
  }

  run() {
    this.create();
    this.showById();
    this.getByEvent();
    this.vote();
  }
};

export default Polls;
