# MySocialNetwork API

API REST pour un réseau social type Facebook - Gestion d'événements, groupes, discussions, albums photos, sondages et billetterie.

## Prérequis

- Node.js 18+
- MongoDB Atlas (ou MongoDB local)

## Installation

```bash
npm install
```

## Configuration

1. Copier le fichier `.env.example` en `.env` :
   ```bash
   # Linux / Mac / PowerShell
   cp .env.example .env
   # Windows (CMD)
   copy .env.example .env
   ```

2. Remplir le fichier `.env` avec vos valeurs :
   - **MONGODB_URI** : URL de connexion MongoDB
     - Atlas : `mongodb+srv://user:password@cluster.mongodb.net/mysocialnetwork`
     - Local : `mongodb://127.0.0.1:27017/mysocialnetwork`
   - **JWT_SECRET** : Clé secrète pour signer les tokens (à changer en production)

3. Si aucune variable d'environnement n'est définie, l'API utilise MongoDB local par défaut (`mongodb://127.0.0.1:27017/mysocialnetwork`).

## Lancement

```bash
# Développement
npm run dev

# Production
npm run prod
```

L'API écoute sur le port 3000 par défaut.

## Authentification

L'API utilise JWT. Après inscription ou connexion, inclure le token dans les requêtes :

```
Authorization: Bearer <token>
```

### Inscription
```http
POST /auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "motdepasse123",
  "firstname": "Jean",
  "lastname": "Dupont"
}
```

### Connexion
```http
POST /auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "motdepasse123"
}
```

## Endpoints principaux

### Utilisateurs
| Méthode | Endpoint | Description |
|---------|----------|-------------|
| GET | /users | Liste des utilisateurs |
| GET | /users/:id | Détail utilisateur |
| POST | /users | Créer utilisateur |
| PUT | /users/:id | Modifier utilisateur |
| DELETE | /users/:id | Supprimer utilisateur |

### Groupes
| Méthode | Endpoint | Description |
|---------|----------|-------------|
| GET | /groups | Liste des groupes |
| GET | /groups/:id | Détail groupe |
| POST | /groups | Créer groupe |
| PUT | /groups/:id | Modifier groupe |
| POST | /groups/:id/members | Ajouter un membre |
| GET | /groups/:id/events | Événements du groupe |

### Événements
| Méthode | Endpoint | Description |
|---------|----------|-------------|
| GET | /events | Liste des événements |
| GET | /events/:id | Détail événement |
| POST | /events | Créer événement |
| PUT | /events/:id | Modifier événement |
| POST | /events/:id/participants | Ajouter participant |

### Fils de discussion
| Méthode | Endpoint | Description |
|---------|----------|-------------|
| GET | /discussion-threads?groupId=xxx | Fil d'un groupe |
| GET | /discussion-threads?eventId=xxx | Fil d'un événement |
| GET | /discussion-threads/:id | Détail fil |
| POST | /discussion-threads | Créer fil |
| POST | /discussion-threads/:threadId/messages | Ajouter message |
| POST | /discussion-threads/:threadId/messages/:parentId/replies | Répondre |

### Albums photos
| Méthode | Endpoint | Description |
|---------|----------|-------------|
| GET | /photo-albums/:id | Détail album |
| POST | /photo-albums | Créer album |
| GET | /events/:eventId/photo-albums | Albums d'un événement |
| POST | /photo-albums/:albumId/photos | Ajouter photo |
| POST | /photos/:photoId/comments | Commenter une photo |

### Sondages
| Méthode | Endpoint | Description |
|---------|----------|-------------|
| GET | /polls/:id | Détail sondage |
| GET | /events/:eventId/polls | Sondages d'un événement |
| POST | /polls | Créer sondage (organisateur) |
| POST | /polls/:id/vote | Voter (participant) |

### Billetterie
| Méthode | Endpoint | Description |
|---------|----------|-------------|
| GET | /events/:eventId/ticket-types | Types de billets |
| POST | /events/:eventId/ticket-types | Créer type (organisateur) |
| POST | /tickets/purchase | Acheter un billet |
| GET | /events/:eventId/tickets | Liste des billets (organisateur) |

### Liste de courses (Bonus)
| Méthode | Endpoint | Description |
|---------|----------|-------------|
| GET | /events/:eventId/shopping-items | Éléments de la liste |
| POST | /events/:eventId/shopping-items | Ajouter un élément |
| DELETE | /events/:eventId/shopping-items/:itemId | Supprimer |

### Covoiturage (Bonus)
| Méthode | Endpoint | Description |
|---------|----------|-------------|
| GET | /events/:eventId/carpools | Propositions de covoiturage |
| POST | /events/:eventId/carpools | Proposer un covoiturage |
| POST | /carpools/:id/join | Rejoindre un covoiturage |

## Collections MongoDB

- **users** : Utilisateurs (email unique)
- **groups** : Groupes (public, privé, secret)
- **events** : Événements
- **discussion_threads** : Fils de discussion (liés à un groupe OU un événement)
- **messages** : Messages dans les fils
- **photo_albums** : Albums photos (1 par événement)
- **photos** : Photos avec commentaires
- **photo_comments** : Commentaires sur les photos
- **polls** : Sondages avec questions/réponses
- **ticket_types** : Types de billets
- **tickets** : Billets achetés
- **shopping_items** : Éléments liste de courses
- **carpools** : Propositions de covoiturage

## Spécifications respectées

- ✅ Utilisateurs avec email unique
- ✅ Événements avec organisateurs et participants
- ✅ Groupes avec admins et membres
- ✅ Fils de discussion (groupe OU événement)
- ✅ Messages et réponses
- ✅ Albums photos par événement
- ✅ Commentaires sur les photos
- ✅ Sondages avec questions à choix unique
- ✅ Billetterie pour événements publics
- ✅ Liste de courses (bonus)
- ✅ Covoiturage (bonus)
