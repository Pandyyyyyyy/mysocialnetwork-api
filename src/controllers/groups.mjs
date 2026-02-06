import GroupModel from '../models/group.mjs';
import EventModel from '../models/event.mjs';
import DiscussionThreadModel from '../models/discussionThread.mjs';
import { handleValidationErrors, groupCreateValidator, groupUpdateValidator } from '../validators/index.mjs';
import { authenticateToken } from './auth.mjs';

const Groups = class Groups {
  constructor(app, connect) {
    this.app = app;
    this.GroupModel = connect.model('Group', GroupModel);
    this.EventModel = connect.model('Event', EventModel);
    this.DiscussionThreadModel = connect.model('DiscussionThread', DiscussionThreadModel);
    this.run();
  }

  create() {
    this.app.post(
      '/groups',
      authenticateToken,
      groupCreateValidator,
      handleValidationErrors,
      async (req, res) => {
        try {
          const group = new this.GroupModel(req.body);
          await group.save();
          const thread = new this.DiscussionThreadModel({
            groupId: group._id
          });
          await thread.save();
          res.status(201).json({ ...group.toJSON(), discussionThreadId: thread._id });
        } catch (err) {
          console.error('[ERROR] groups/create ->', err);
          res.status(500).json({ code: 500, message: 'Erreur serveur' });
        }
      }
    );
  }

  findAll() {
    this.app.get('/groups', async (req, res) => {
      try {
        const groups = await this.GroupModel.find(req.query)
          .populate('admins', 'firstname lastname email avatar')
          .populate('members', 'firstname lastname email avatar');
        res.status(200).json(groups);
      } catch (err) {
        console.error('[ERROR] GET /groups ->', err);
        res.status(500).json({ code: 500, message: 'Erreur serveur' });
      }
    });
  }

  showById() {
    this.app.get('/groups/:id', async (req, res) => {
      try {
        const group = await this.GroupModel.findById(req.params.id)
          .populate('admins', 'firstname lastname email avatar')
          .populate('members', 'firstname lastname email avatar');
        if (!group) {
          return res.status(404).json({ code: 404, message: 'Groupe non trouvé' });
        }
        res.status(200).json(group);
      } catch (err) {
        console.error('[ERROR] groups/:id ->', err);
        res.status(500).json({ code: 500, message: 'Erreur serveur' });
      }
    });
  }

  update() {
    this.app.put(
      '/groups/:id',
      authenticateToken,
      groupUpdateValidator,
      handleValidationErrors,
      async (req, res) => {
        try {
          const group = await this.GroupModel.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true }
          );
          if (!group) {
            return res.status(404).json({ code: 404, message: 'Groupe non trouvé' });
          }
          res.status(200).json(group);
        } catch (err) {
          console.error('[ERROR] PUT /groups/:id ->', err);
          res.status(500).json({ code: 500, message: 'Erreur serveur' });
        }
      }
    );
  }

  addMember() {
    this.app.post(
      '/groups/:id/members',
      authenticateToken,
      async (req, res) => {
        try {
          const { userId } = req.body;
          const group = await this.GroupModel.findByIdAndUpdate(
            req.params.id,
            { $addToSet: { members: userId } },
            { new: true }
          );
          if (!group) {
            return res.status(404).json({ code: 404, message: 'Groupe non trouvé' });
          }
          res.status(200).json(group);
        } catch (err) {
          console.error('[ERROR] groups/:id/members ->', err);
          res.status(500).json({ code: 500, message: 'Erreur serveur' });
        }
      }
    );
  }

  getEvents() {
    this.app.get('/groups/:id/events', async (req, res) => {
      try {
        const events = await this.EventModel.find({ groupId: req.params.id })
          .populate('organizers', 'firstname lastname email')
          .populate('participants', 'firstname lastname email');
        res.status(200).json(events);
      } catch (err) {
        console.error('[ERROR] groups/:id/events ->', err);
        res.status(500).json({ code: 500, message: 'Erreur serveur' });
      }
    });
  }

  run() {
    this.create();
    this.findAll();
    this.showById();
    this.update();
    this.addMember();
    this.getEvents();
  }
};

export default Groups;
