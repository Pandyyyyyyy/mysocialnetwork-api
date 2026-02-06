import PhotoAlbumModel from '../models/photoAlbum.mjs';
import PhotoModel from '../models/photo.mjs';
import PhotoCommentModel from '../models/photoComment.mjs';
import EventModel from '../models/event.mjs';
import { handleValidationErrors, photoAlbumCreateValidator, photoCreateValidator, photoCommentCreateValidator } from '../validators/index.mjs';
import { authenticateToken } from './auth.mjs';

const PhotoAlbums = class PhotoAlbums {
  constructor(app, connect) {
    this.app = app;
    this.PhotoAlbumModel = connect.model('PhotoAlbum', PhotoAlbumModel);
    this.PhotoModel = connect.model('Photo', PhotoModel);
    this.PhotoCommentModel = connect.model('PhotoComment', PhotoCommentModel);
    this.EventModel = connect.model('Event', EventModel);
    this.run();
  }

  create() {
    this.app.post(
      '/photo-albums',
      authenticateToken,
      photoAlbumCreateValidator,
      handleValidationErrors,
      async (req, res) => {
        try {
          const album = new this.PhotoAlbumModel(req.body);
          await album.save();
          res.status(201).json(album);
        } catch (err) {
          console.error('[ERROR] photo-albums/create ->', err);
          res.status(500).json({ code: 500, message: 'Erreur serveur' });
        }
      }
    );
  }

  showById() {
    this.app.get('/photo-albums/:id', async (req, res) => {
      try {
        const album = await this.PhotoAlbumModel.findById(req.params.id)
          .populate({
            path: 'photos',
            populate: [
              { path: 'postedBy', select: 'firstname lastname avatar' },
              { path: 'comments', populate: { path: 'author', select: 'firstname lastname avatar' } }
            ]
          });
        if (!album) {
          return res.status(404).json({ code: 404, message: 'Album non trouvé' });
        }
        res.status(200).json(album);
      } catch (err) {
        console.error('[ERROR] photo-albums/:id ->', err);
        res.status(500).json({ code: 500, message: 'Erreur serveur' });
      }
    });
  }

  getByEvent() {
    this.app.get('/events/:eventId/photo-albums', async (req, res) => {
      try {
        const albums = await this.PhotoAlbumModel.find({ eventId: req.params.eventId })
          .populate('photos');
        res.status(200).json(albums);
      } catch (err) {
        console.error('[ERROR] events/:eventId/photo-albums ->', err);
        res.status(500).json({ code: 500, message: 'Erreur serveur' });
      }
    });
  }

  addPhoto() {
    this.app.post(
      '/photo-albums/:albumId/photos',
      authenticateToken,
      photoCreateValidator,
      handleValidationErrors,
      async (req, res) => {
        try {
          const { albumId } = req.params;
          const album = await this.PhotoAlbumModel.findById(albumId);
          if (!album) {
            return res.status(404).json({ code: 404, message: 'Album non trouvé' });
          }
          const event = await this.EventModel.findById(album.eventId).select('participants organizers').lean();
          const isParticipant = event.participants.some(p => p.toString() === req.user.id);
          const isOrganizer = event.organizers.some(o => o.toString() === req.user.id);
          if (!isParticipant && !isOrganizer) {
            return res.status(403).json({ code: 403, message: 'Seuls les participants ou organisateurs peuvent poster des photos' });
          }
          const photo = new this.PhotoModel({
            ...req.body,
            albumId,
            postedBy: req.user.id
          });
          await photo.save();
          await this.PhotoAlbumModel.findByIdAndUpdate(albumId, {
            $push: { photos: photo._id }
          });
          const populated = await this.PhotoModel.findById(photo._id)
            .populate('postedBy', 'firstname lastname avatar');
          res.status(201).json(populated);
        } catch (err) {
          console.error('[ERROR] photo-albums/photos ->', err);
          res.status(500).json({ code: 500, message: 'Erreur serveur' });
        }
      }
    );
  }

  addComment() {
    this.app.post(
      '/photos/:photoId/comments',
      authenticateToken,
      (req, res, next) => {
        req.body.photoId = req.params.photoId;
        next();
      },
      photoCommentCreateValidator,
      handleValidationErrors,
      async (req, res) => {
        try {
          const { photoId } = req.params;
          const comment = new this.PhotoCommentModel({
            ...req.body,
            photoId,
            author: req.user.id
          });
          await comment.save();
          await this.PhotoModel.findByIdAndUpdate(photoId, {
            $push: { comments: comment._id }
          });
          const populated = await this.PhotoCommentModel.findById(comment._id)
            .populate('author', 'firstname lastname avatar');
          res.status(201).json(populated);
        } catch (err) {
          console.error('[ERROR] photos/comments ->', err);
          res.status(500).json({ code: 500, message: 'Erreur serveur' });
        }
      }
    );
  }

  run() {
    this.create();
    this.showById();
    this.getByEvent();
    this.addPhoto();
    this.addComment();
  }
};

export default PhotoAlbums;
