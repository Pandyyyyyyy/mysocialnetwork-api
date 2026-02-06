import DiscussionThreadModel from '../models/discussionThread.mjs';
import MessageModel from '../models/message.mjs';
import { handleValidationErrors, discussionThreadCreateValidator, messageCreateValidator } from '../validators/index.mjs';
import { authenticateToken } from './auth.mjs';

const DiscussionThreads = class DiscussionThreads {
  constructor(app, connect) {
    this.app = app;
    this.DiscussionThreadModel = connect.model('DiscussionThread', DiscussionThreadModel);
    this.MessageModel = connect.model('Message', MessageModel);
    this.run();
  }

  create() {
    this.app.post(
      '/discussion-threads',
      authenticateToken,
      discussionThreadCreateValidator,
      handleValidationErrors,
      async (req, res) => {
        try {
          const thread = new this.DiscussionThreadModel(req.body);
          await thread.save();
          res.status(201).json(thread);
        } catch (err) {
          console.error('[ERROR] discussion-threads/create ->', err);
          res.status(500).json({ code: 500, message: 'Erreur serveur' });
        }
      }
    );
  }

  getByGroupOrEvent() {
    this.app.get('/discussion-threads', async (req, res) => {
      try {
        const { groupId, eventId } = req.query;
        if (!groupId && !eventId) {
          return res.status(400).json({
            code: 400,
            message: 'groupId ou eventId requis'
          });
        }
        if (groupId && eventId) {
          return res.status(400).json({
            code: 400,
            message: 'Un seul paramètre groupId ou eventId autorisé'
          });
        }
        const query = groupId ? { groupId } : { eventId };
        const thread = await this.DiscussionThreadModel.findOne(query)
          .populate({
            path: 'messages',
            populate: [
              { path: 'author', select: 'firstname lastname avatar' },
              { path: 'replies', populate: { path: 'author', select: 'firstname lastname avatar' } }
            ]
          });
        if (!thread) {
          return res.status(404).json({ code: 404, message: 'Fil non trouvé' });
        }
        res.status(200).json(thread);
      } catch (err) {
        console.error('[ERROR] discussion-threads ->', err);
        res.status(500).json({ code: 500, message: 'Erreur serveur' });
      }
    });
  }

  showById() {
    this.app.get('/discussion-threads/:id', async (req, res) => {
      try {
        const thread = await this.DiscussionThreadModel.findById(req.params.id)
          .populate({
            path: 'messages',
            populate: { path: 'author', select: 'firstname lastname avatar' }
          });
        if (!thread) {
          return res.status(404).json({ code: 404, message: 'Fil non trouvé' });
        }
        res.status(200).json(thread);
      } catch (err) {
        console.error('[ERROR] discussion-threads/:id ->', err);
        res.status(500).json({ code: 500, message: 'Erreur serveur' });
      }
    });
  }

  addMessage() {
    this.app.post(
      '/discussion-threads/:threadId/messages',
      authenticateToken,
      (req, res, next) => {
        req.body.threadId = req.params.threadId;
        next();
      },
      messageCreateValidator,
      handleValidationErrors,
      async (req, res) => {
        try {
          const { threadId } = req.params;
          const message = new this.MessageModel({
            ...req.body,
            threadId,
            author: req.user.id
          });
          await message.save();
          await this.DiscussionThreadModel.findByIdAndUpdate(threadId, {
            $push: { messages: message._id }
          });
          const populated = await this.MessageModel.findById(message._id)
            .populate('author', 'firstname lastname avatar');
          res.status(201).json(populated);
        } catch (err) {
          console.error('[ERROR] discussion-threads/messages ->', err);
          res.status(500).json({ code: 500, message: 'Erreur serveur' });
        }
      }
    );
  }

  addReply() {
    this.app.post(
      '/discussion-threads/:threadId/messages/:parentId/replies',
      authenticateToken,
      async (req, res) => {
        try {
          const { threadId, parentId } = req.params;
          const message = new this.MessageModel({
            content: req.body.content,
            threadId,
            parentMessageId: parentId,
            author: req.user.id
          });
          await message.save();
          await this.MessageModel.findByIdAndUpdate(parentId, {
            $push: { replies: message._id }
          });
          await this.DiscussionThreadModel.findByIdAndUpdate(threadId, {
            $push: { messages: message._id }
          });
          const populated = await this.MessageModel.findById(message._id)
            .populate('author', 'firstname lastname avatar');
          res.status(201).json(populated);
        } catch (err) {
          console.error('[ERROR] discussion-threads/replies ->', err);
          res.status(500).json({ code: 500, message: 'Erreur serveur' });
        }
      }
    );
  }

  run() {
    this.create();
    this.getByGroupOrEvent();
    this.showById();
    this.addMessage();
    this.addReply();
  }
};

export default DiscussionThreads;
