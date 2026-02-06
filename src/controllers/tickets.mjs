import TicketTypeModel from '../models/ticketType.mjs';
import TicketModel from '../models/ticket.mjs';
import EventModel from '../models/event.mjs';
import {
  handleValidationErrors,
  ticketTypeCreateValidator,
  ticketPurchaseValidator
} from '../validators/index.mjs';
import { authenticateToken } from './auth.mjs';

const Tickets = class Tickets {
  constructor(app, connect) {
    this.app = app;
    this.TicketTypeModel = connect.model('TicketType', TicketTypeModel);
    this.TicketModel = connect.model('Ticket', TicketModel);
    this.EventModel = connect.model('Event', EventModel);
    this.run();
  }

  createTicketType() {
    this.app.post(
      '/events/:eventId/ticket-types',
      authenticateToken,
      ticketTypeCreateValidator,
      handleValidationErrors,
      async (req, res) => {
        try {
          const { eventId } = req.params;
          const event = await this.EventModel.findById(eventId);
          if (!event) {
            return res.status(404).json({ code: 404, message: 'Événement non trouvé' });
          }
          if (event.isPrivate) {
            return res.status(400).json({
              code: 400,
              message: 'La billetterie n\'est disponible que pour les événements publics'
            });
          }
          const isOrganizer = event.organizers.some(
            o => o.toString() === req.user.id || o._id?.toString() === req.user.id
          );
          if (!isOrganizer) {
            return res.status(403).json({ code: 403, message: 'Seuls les organisateurs peuvent créer des types de billets' });
          }
          const ticketType = new this.TicketTypeModel({
            ...req.body,
            eventId
          });
          await ticketType.save();
          res.status(201).json(ticketType);
        } catch (err) {
          console.error('[ERROR] ticket-types/create ->', err);
          res.status(500).json({ code: 500, message: 'Erreur serveur' });
        }
      }
    );
  }

  getTicketTypes() {
    this.app.get('/events/:eventId/ticket-types', async (req, res) => {
      try {
        const types = await this.TicketTypeModel.find({ eventId: req.params.eventId });
        res.status(200).json(types);
      } catch (err) {
        console.error('[ERROR] events/:eventId/ticket-types ->', err);
        res.status(500).json({ code: 500, message: 'Erreur serveur' });
      }
    });
  }

  purchase() {
    this.app.post(
      '/tickets/purchase',
      ticketPurchaseValidator,
      handleValidationErrors,
      async (req, res) => {
        try {
          const ticketType = await this.TicketTypeModel.findById(req.body.ticketTypeId);
          if (!ticketType) {
            return res.status(404).json({ code: 404, message: 'Type de billet non trouvé' });
          }
          if (ticketType.soldCount >= ticketType.quantity) {
            return res.status(400).json({ code: 400, message: 'Plus de billets disponibles' });
          }
          const existingTicket = await this.TicketModel.findOne({
            ticketTypeId: req.body.ticketTypeId,
            buyerEmail: req.body.buyerEmail
          });
          if (existingTicket) {
            return res.status(400).json({
              code: 400,
              message: 'Une personne ne peut acheter qu\'un seul billet par type'
            });
          }
          const ticket = new this.TicketModel({
            ...req.body,
            eventId: ticketType.eventId
          });
          await ticket.save();
          await this.TicketTypeModel.findByIdAndUpdate(req.body.ticketTypeId, {
            $inc: { soldCount: 1 }
          });
          res.status(201).json(ticket);
        } catch (err) {
          console.error('[ERROR] tickets/purchase ->', err);
          res.status(500).json({ code: 500, message: 'Erreur serveur' });
        }
      }
    );
  }

  getByEvent() {
    this.app.get('/events/:eventId/tickets', authenticateToken, async (req, res) => {
      try {
        const event = await this.EventModel.findById(req.params.eventId);
        if (!event) {
          return res.status(404).json({ code: 404, message: 'Événement non trouvé' });
        }
        const isOrganizer = event.organizers.some(
          o => o.toString() === req.user.id || o._id?.toString() === req.user.id
        );
        if (!isOrganizer) {
          return res.status(403).json({ code: 403, message: 'Accès réservé aux organisateurs' });
        }
        const tickets = await this.TicketModel.find({ eventId: req.params.eventId });
        res.status(200).json(tickets);
      } catch (err) {
        console.error('[ERROR] events/:eventId/tickets ->', err);
        res.status(500).json({ code: 500, message: 'Erreur serveur' });
      }
    });
  }

  run() {
    this.createTicketType();
    this.getTicketTypes();
    this.purchase();
    this.getByEvent();
  }
};

export default Tickets;
