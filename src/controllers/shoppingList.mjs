import ShoppingItemModel from '../models/shoppingItem.mjs';
import EventModel from '../models/event.mjs';
import { handleValidationErrors, shoppingItemCreateValidator } from '../validators/index.mjs';
import { authenticateToken } from './auth.mjs';

const ShoppingList = class ShoppingList {
  constructor(app, connect) {
    this.app = app;
    this.ShoppingItemModel = connect.model('ShoppingItem', ShoppingItemModel);
    this.EventModel = connect.model('Event', EventModel);
    this.run();
  }

  addItem() {
    this.app.post(
      '/events/:eventId/shopping-items',
      authenticateToken,
      (req, res, next) => {
        req.body.eventId = req.params.eventId;
        next();
      },
      shoppingItemCreateValidator,
      handleValidationErrors,
      async (req, res) => {
        try {
          const { eventId } = req.params;
          const event = await this.EventModel.findById(eventId);
          if (!event) {
            return res.status(404).json({ code: 404, message: 'Événement non trouvé' });
          }
          if (!event.shoppingListEnabled) {
            return res.status(400).json({
              code: 400,
              message: 'La liste de courses n\'est pas activée pour cet événement'
            });
          }
          const isParticipant = event.participants.some(
            p => p.toString() === req.user.id || p._id?.toString() === req.user.id
          );
          if (!isParticipant) {
            return res.status(403).json({ code: 403, message: 'Seuls les participants peuvent ajouter des éléments' });
          }
          const item = new this.ShoppingItemModel({
            ...req.body,
            eventId,
            broughtBy: req.user.id
          });
          await item.save();
          const populated = await this.ShoppingItemModel.findById(item._id)
            .populate('broughtBy', 'firstname lastname');
          res.status(201).json(populated);
        } catch (err) {
          if (err.code === 11000) {
            return res.status(400).json({
              code: 400,
              message: 'Cet élément existe déjà pour cet événement'
            });
          }
          console.error('[ERROR] shopping-items/create ->', err);
          res.status(500).json({ code: 500, message: 'Erreur serveur' });
        }
      }
    );
  }

  getByEvent() {
    this.app.get('/events/:eventId/shopping-items', async (req, res) => {
      try {
        const event = await this.EventModel.findById(req.params.eventId);
        if (!event) {
          return res.status(404).json({ code: 404, message: 'Événement non trouvé' });
        }
        const items = await this.ShoppingItemModel.find({ eventId: req.params.eventId })
          .populate('broughtBy', 'firstname lastname');
        res.status(200).json(items);
      } catch (err) {
        console.error('[ERROR] events/:eventId/shopping-items ->', err);
        res.status(500).json({ code: 500, message: 'Erreur serveur' });
      }
    });
  }

  deleteItem() {
    this.app.delete(
      '/events/:eventId/shopping-items/:itemId',
      authenticateToken,
      async (req, res) => {
        try {
          const item = await this.ShoppingItemModel.findOne({
            _id: req.params.itemId,
            eventId: req.params.eventId
          });
          if (!item) {
            return res.status(404).json({ code: 404, message: 'Élément non trouvé' });
          }
          if (item.broughtBy.toString() !== req.user.id) {
            return res.status(403).json({ code: 403, message: 'Vous ne pouvez supprimer que vos propres éléments' });
          }
          await this.ShoppingItemModel.findByIdAndDelete(req.params.itemId);
          res.status(200).json({ message: 'Élément supprimé' });
        } catch (err) {
          console.error('[ERROR] shopping-items/delete ->', err);
          res.status(500).json({ code: 500, message: 'Erreur serveur' });
        }
      }
    );
  }

  run() {
    this.addItem();
    this.getByEvent();
    this.deleteItem();
  }
};

export default ShoppingList;
