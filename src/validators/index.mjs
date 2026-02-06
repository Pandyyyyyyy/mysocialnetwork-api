import { body, param, query, validationResult } from 'express-validator';

export const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      code: 400,
      message: 'Validation error',
      errors: errors.array()
    });
  }
  next();
};

export const userCreateValidator = [
  body('email').isEmail().normalizeEmail().withMessage('Email invalide'),
  body('password').isLength({ min: 6 }).withMessage('Mot de passe minimum 6 caractères'),
  body('firstname').notEmpty().trim().withMessage('Prénom requis'),
  body('lastname').notEmpty().trim().withMessage('Nom requis')
];

export const userUpdateValidator = [
  param('id').isMongoId().withMessage('ID invalide'),
  body('firstname').optional().notEmpty().trim(),
  body('lastname').optional().notEmpty().trim(),
  body('avatar').optional().isString(),
  body('birthdate').optional().isISO8601(),
  body('city').optional().isString(),
  body('postalCode').optional().isString(),
  body('address').optional().isString()
];

export const loginValidator = [
  body('email').isEmail().normalizeEmail().withMessage('Email invalide'),
  body('password').notEmpty().withMessage('Mot de passe requis')
];

export const groupCreateValidator = [
  body('name').notEmpty().trim().withMessage('Nom du groupe requis'),
  body('description').optional().isString(),
  body('type').optional().isIn(['public', 'private', 'secret']),
  body('allowMemberPost').optional().isBoolean(),
  body('allowMemberCreateEvents').optional().isBoolean(),
  body('admins').isArray().withMessage('Au moins un administrateur requis'),
  body('admins.*').isMongoId().withMessage('ID administrateur invalide'),
  body('members').optional().isArray(),
  body('members.*').optional().isMongoId()
];

export const groupUpdateValidator = [
  param('id').isMongoId().withMessage('ID invalide'),
  body('name').optional().notEmpty().trim(),
  body('description').optional().isString(),
  body('type').optional().isIn(['public', 'private', 'secret']),
  body('allowMemberPost').optional().isBoolean(),
  body('allowMemberCreateEvents').optional().isBoolean()
];

export const eventCreateValidator = [
  body('name').notEmpty().trim().withMessage('Nom requis'),
  body('description').optional().isString(),
  body('startDate').isISO8601().withMessage('Date de début invalide'),
  body('endDate').isISO8601().withMessage('Date de fin invalide'),
  body('location').notEmpty().trim().withMessage('Lieu requis'),
  body('isPrivate').optional().isBoolean(),
  body('organizers').isArray({ min: 1 }).withMessage('Au moins un organisateur requis'),
  body('organizers.*').isMongoId().withMessage('ID organisateur invalide'),
  body('participants').optional().isArray(),
  body('participants.*').optional().isMongoId(),
  body('groupId').optional().isMongoId(),
  body('shoppingListEnabled').optional().isBoolean(),
  body('carpoolEnabled').optional().isBoolean()
];

export const eventUpdateValidator = [
  param('id').isMongoId().withMessage('ID invalide'),
  body('name').optional().notEmpty().trim(),
  body('description').optional().isString(),
  body('startDate').optional().isISO8601(),
  body('endDate').optional().isISO8601(),
  body('location').optional().notEmpty().trim(),
  body('isPrivate').optional().isBoolean(),
  body('shoppingListEnabled').optional().isBoolean(),
  body('carpoolEnabled').optional().isBoolean()
];

export const messageCreateValidator = [
  body('content').notEmpty().trim().withMessage('Contenu requis'),
  body('threadId').isMongoId().withMessage('ID du fil invalide'),
  body('parentMessageId').optional().isMongoId()
];

export const photoAlbumCreateValidator = [
  body('eventId').isMongoId().withMessage('ID événement invalide'),
  body('name').optional().notEmpty().trim()
];

export const photoCreateValidator = [
  body('albumId').isMongoId().withMessage('ID album invalide'),
  body('url').notEmpty().withMessage('URL de la photo requise')
];

export const photoCommentCreateValidator = [
  body('photoId').isMongoId().withMessage('ID photo invalide'),
  body('content').notEmpty().trim().withMessage('Contenu requis')
];

export const pollCreateValidator = [
  body('eventId').isMongoId().withMessage('ID événement invalide'),
  body('title').notEmpty().trim().withMessage('Titre requis'),
  body('questions').isArray({ min: 1 }).withMessage('Au moins une question requise'),
  body('questions.*.question').notEmpty().trim().withMessage('Question requise'),
  body('questions.*.options').isArray({ min: 2 }).withMessage('Au moins 2 options par question'),
  body('questions.*.options.*').notEmpty().trim()
];

export const pollVoteValidator = [
  body('answers').isArray({ min: 1 }).withMessage('Réponses requises'),
  body('answers.*.questionIndex').isInt({ min: 0 }).withMessage('Index question invalide'),
  body('answers.*.chosenOptionIndex').isInt({ min: 0 }).withMessage('Index option invalide')
];

export const ticketTypeCreateValidator = [
  body('eventId').isMongoId().withMessage('ID événement invalide'),
  body('name').notEmpty().trim().withMessage('Nom requis'),
  body('amount').isFloat({ min: 0 }).withMessage('Montant invalide'),
  body('quantity').isInt({ min: 1 }).withMessage('Quantité invalide')
];

export const ticketPurchaseValidator = [
  body('ticketTypeId').isMongoId().withMessage('ID type de billet invalide'),
  body('firstName').notEmpty().trim().withMessage('Prénom requis'),
  body('lastName').notEmpty().trim().withMessage('Nom requis'),
  body('address').notEmpty().trim().withMessage('Adresse requise'),
  body('buyerEmail').isEmail().normalizeEmail().withMessage('Email invalide')
];

export const shoppingItemCreateValidator = [
  body('eventId').isMongoId().withMessage('ID événement invalide'),
  body('name').notEmpty().trim().withMessage('Nom requis'),
  body('quantity').isInt({ min: 1 }).withMessage('Quantité invalide'),
  body('arrivalTime').isISO8601().withMessage('Heure d\'arrivée invalide')
];

export const carpoolCreateValidator = [
  body('eventId').isMongoId().withMessage('ID événement invalide'),
  body('departureLocation').notEmpty().trim().withMessage('Lieu de départ requis'),
  body('departureTime').isISO8601().withMessage('Heure de départ invalide'),
  body('price').isFloat({ min: 0 }).withMessage('Prix invalide'),
  body('availableSeats').isInt({ min: 1 }).withMessage('Places disponibles invalides'),
  body('maxTimeDifferenceMinutes').optional().isInt({ min: 0 })
];

export const discussionThreadCreateValidator = [
  body('groupId').optional().isMongoId(),
  body('eventId').optional().isMongoId(),
  body().custom((value, { req }) => {
    const { groupId, eventId } = req.body;
    if ((groupId && eventId) || (!groupId && !eventId)) {
      throw new Error('Un fil doit être lié à un groupe OU un événement, pas les deux');
    }
    return true;
  })
];
