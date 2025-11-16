# 🏢 ProprioFinder - SaaS de Recherche de Propriétaires Immobiliers

SaaS complet pour retrouver les propriétaires immobiliers en France à partir de bases de données PostgreSQL, avec enrichissement de contacts et système de crédits.

## 🎯 Fonctionnalités

### Recherches
- ✅ **Recherche par adresse** - Trouve tous les propriétaires d'un bien
- ✅ **Recherche par propriétaire** - Trouve toutes les propriétés d'un propriétaire
- ✅ **Recherche par zone géographique** - Dessine une zone sur carte interactive (Leaflet)

### Système de Crédits
- ✅ Facturation au nombre de lignes (pas de requêtes)
- ✅ Workflow : Estimation → Validation → Exécution
- ✅ Débit de crédits après validation uniquement
- ✅ Intégration Stripe pour paiements

### Enrichissement de Données
- ✅ **Liens gratuits** vers Google Maps, Street View, Pappers, Cadastre, DVF, Géoportail
- ✅ **Enrichissement contacts** (PRO/ENTERPRISE) via Dropcontact : email, téléphone, LinkedIn
- ✅ Worker asynchrone avec BullMQ et Redis

### Multi-tenant
- ✅ Organisations avec plusieurs utilisateurs
- ✅ Rôles : Owner, Admin, Member
- ✅ Crédits partagés par organisation

### Exports
- ✅ Export CSV avec tous les liens d'enrichissement
- ✅ Téléchargement instantané des résultats

## 🛠️ Stack Technique

- **Framework** : Next.js 14 (App Router)
- **UI** : shadcn/ui + Tailwind CSS
- **Base de données** : PostgreSQL + Prisma ORM
- **Authentification** : NextAuth.js
- **Paiements** : Stripe
- **Enrichissement** : Dropcontact API
- **Cartes** : React Leaflet + Leaflet Draw
- **Queue** : BullMQ + Redis
- **Géospatial** : Turf.js

## 📦 Installation

### Prérequis

```bash
- Node.js 18+
- PostgreSQL 14+
- Redis 6+
```

### 1. Cloner et installer

```bash
git clone https://github.com/votre-username/proprio1.git
cd proprio1
npm install
```

### 2. Configuration de la base de données

#### Option A : Base de données vide

```bash
# Copier .env.example
cp .env.example .env

# Éditer .env avec vos credentials PostgreSQL
# DATABASE_URL="postgresql://user:password@localhost:5432/proprio_finder"

# Pusher le schéma Prisma
npm run db:push

# Générer le client Prisma
npm run db:generate
```

#### Option B : Base de données existante

Si vous avez déjà une base PostgreSQL avec des données immobilières :

```sql
-- Votre table doit avoir au minimum ces colonnes :
-- (adaptez les noms dans les APIs si différents)

CREATE TABLE your_properties_table (
  id SERIAL PRIMARY KEY,
  adresse VARCHAR(255),
  code_postal VARCHAR(5),
  ville VARCHAR(100),
  code_commune VARCHAR(5),
  proprietaire VARCHAR(255),
  siren VARCHAR(9),
  company_name VARCHAR(255),
  type_local VARCHAR(50),
  surface DECIMAL(10,2),
  latitude DECIMAL(10,8),
  longitude DECIMAL(11,8),
  section VARCHAR(5),
  numero_parcelle VARCHAR(10)
);

-- Index recommandés
CREATE INDEX idx_coords ON your_properties_table(latitude, longitude);
CREATE INDEX idx_postal ON your_properties_table(code_postal);
CREATE INDEX idx_siren ON your_properties_table(siren);
```

**IMPORTANT** : Dans les fichiers API (`app/api/search/*/route.ts`), remplacez `your_properties_table` par le nom réel de votre table.

### 3. Configuration des variables d'environnement

Éditez `.env` :

```bash
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/proprio_finder"

# NextAuth (générer avec: openssl rand -base64 32)
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="votre-secret-genere"

# Stripe (récupérer sur stripe.com/dashboard)
STRIPE_SECRET_KEY="sk_test_..."
STRIPE_PUBLISHABLE_KEY="pk_test_..."
STRIPE_WEBHOOK_SECRET="whsec_..." # Après configuration webhook

# Stripe Price IDs (créer les produits sur Stripe)
STRIPE_BASIC_PRICE_ID="price_..."
STRIPE_PRO_PRICE_ID="price_..."
STRIPE_ENTERPRISE_PRICE_ID="price_..."

# Dropcontact (optionnel, pour enrichissement)
DROPCONTACT_API_KEY="votre_cle_dropcontact"

# Redis
REDIS_URL="redis://localhost:6379"
REDIS_HOST="localhost"
REDIS_PORT="6379"

# App
NEXT_PUBLIC_APP_URL="http://localhost:3000"
NEXT_PUBLIC_APP_NAME="ProprioFinder"
```

### 4. Configuration Stripe

#### Créer les produits sur Stripe

1. Aller sur https://dashboard.stripe.com/products
2. Créer 3 produits :
   - **Basic** : 29€/mois
   - **Pro** : 99€/mois
   - **Enterprise** : 349€/mois
3. Copier les Price IDs dans `.env`

#### Configurer le webhook

```bash
# En développement, utiliser Stripe CLI
stripe listen --forward-to localhost:3000/api/webhooks/stripe

# Copier le webhook secret (whsec_...) dans .env
```

En production, configurer le webhook sur :
- URL : `https://votre-domaine.com/api/webhooks/stripe`
- Événements : `checkout.session.completed`, `invoice.payment_succeeded`, `customer.subscription.updated`, `customer.subscription.deleted`

### 5. Démarrer Redis

```bash
# Avec Docker
docker run -d -p 6379:6379 redis:7-alpine

# Ou installation locale (macOS)
brew install redis
brew services start redis
```

### 6. Lancer l'application

```bash
# Terminal 1 : Next.js
npm run dev

# Terminal 2 : Worker d'enrichissement
npx ts-node workers/enrichment-worker.ts

# Terminal 3 (optionnel) : Stripe CLI pour webhooks
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```

Ouvrir http://localhost:3000

## 🚀 Déploiement en Production

### Option 1 : Vercel (Recommandé)

```bash
# Installer Vercel CLI
npm i -g vercel

# Déployer
vercel

# Configurer les variables d'environnement sur Vercel dashboard
# Ajouter le webhook Stripe sur l'URL de production
```

### Option 2 : Docker

```bash
# Créer l'image
docker build -t proprio-finder .

# Lancer avec Docker Compose (incluant PostgreSQL et Redis)
docker-compose up -d
```

### Option 3 : VPS (Ubuntu/Debian)

```bash
# Installer Node.js, PostgreSQL, Redis
sudo apt update
sudo apt install nodejs npm postgresql redis-server

# Cloner et configurer
git clone https://github.com/votre-username/proprio1.git
cd proprio1
npm install
npm run build

# Utiliser PM2 pour gérer les processus
npm install -g pm2
pm2 start npm --name "proprio-web" -- start
pm2 start workers/enrichment-worker.ts --name "proprio-worker"

# Configurer Nginx comme reverse proxy
```

## 📝 Usage

### 1. Créer un compte et une organisation

1. Aller sur `/auth/signin`
2. S'inscrire avec email/mot de passe
3. Une organisation est créée automatiquement

### 2. Souscrire à un plan

1. Aller sur `/pricing`
2. Choisir un plan (Basic, Pro, ou Enterprise)
3. Payer via Stripe
4. Les crédits sont ajoutés automatiquement

### 3. Faire une recherche

1. Aller sur `/search`
2. Choisir un type de recherche :
   - **Par adresse** : Entrer adresse et code postal
   - **Par propriétaire** : Entrer nom ou SIREN
   - **Par zone** : Dessiner sur la carte
3. Cliquer sur "Estimer"
4. Voir le nombre de résultats et le coût
5. Cliquer sur "Valider" pour exécuter
6. Télécharger le CSV avec les résultats

### 4. Enrichir les contacts (PRO/ENTERPRISE)

Après une recherche terminée :

1. Cliquer sur "Enrichir les contacts"
2. Le système utilise Dropcontact pour trouver emails/téléphones
3. Attendre la fin de l'enrichissement (worker asynchrone)
4. Télécharger le CSV enrichi

## 🏗️ Architecture du Projet

```
proprio1/
├── app/                          # Next.js App Router
│   ├── api/                      # API Routes
│   │   ├── auth/[...nextauth]/   # NextAuth
│   │   ├── search/               # APIs de recherche
│   │   │   ├── estimate/         # Estimation
│   │   │   ├── validate/         # Validation
│   │   │   ├── execute/          # Exécution
│   │   │   └── download/         # Téléchargement CSV
│   │   ├── stripe/               # Stripe checkout & portal
│   │   ├── webhooks/stripe/      # Webhooks Stripe
│   │   └── enrich/               # Enrichissement
│   ├── dashboard/                # Dashboard organisation
│   ├── search/                   # Interface de recherche
│   ├── pricing/                  # Page tarifs
│   ├── globals.css               # Styles globaux
│   ├── layout.tsx                # Layout racine
│   └── page.tsx                  # Page d'accueil
├── components/
│   └── ui/                       # Composants shadcn/ui
├── lib/
│   ├── prisma.ts                 # Client Prisma
│   ├── auth.ts                   # Configuration NextAuth
│   ├── stripe.ts                 # Utilitaires Stripe
│   ├── credits.ts                # Gestion des crédits
│   ├── dropcontact.ts            # API Dropcontact
│   ├── enrichment-links.ts       # Génération de liens
│   └── utils.ts                  # Utilitaires divers
├── prisma/
│   └── schema.prisma             # Schéma de base de données
├── workers/
│   └── enrichment-worker.ts      # Worker BullMQ
├── types/
│   └── next-auth.d.ts            # Types TypeScript
├── .env.example                  # Variables d'environnement
├── next.config.js                # Configuration Next.js
├── tailwind.config.ts            # Configuration Tailwind
├── tsconfig.json                 # Configuration TypeScript
└── package.json                  # Dépendances
```

## 💰 Plans Tarifaires

| Plan | Prix | Crédits inclus | Enrichissement | Support |
|------|------|----------------|----------------|---------|
| **FREE** | 0€ | 0 | ❌ | Email |
| **BASIC** | 29€/mois | 500 | ❌ | Email |
| **PRO** | 99€/mois | 3 000 | ✅ | Prioritaire |
| **ENTERPRISE** | 349€/mois | 20 000 | ✅ | Dédié |

## 🔧 Maintenance

### Mettre à jour les données cadastre/DVF

Les liens générés pointent vers les sources officielles qui sont toujours à jour.
Aucune maintenance nécessaire.

### Mettre à jour Prisma après modification du schéma

```bash
npm run db:push
npm run db:generate
```

### Surveiller les workers

```bash
# Avec PM2
pm2 logs proprio-worker

# Logs BullMQ dans l'interface (optionnel)
npm install -g bull-board
```

## 🐛 Dépannage

### Erreur "your_properties_table" n'existe pas

Remplacez `your_properties_table` par le nom de votre table dans :
- `app/api/search/estimate/route.ts`
- `app/api/search/execute/route.ts`

### Worker d'enrichissement ne démarre pas

Vérifier que Redis fonctionne :
```bash
redis-cli ping
# Doit répondre PONG
```

### Webhooks Stripe ne fonctionnent pas

En développement, utiliser Stripe CLI :
```bash
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```

En production, vérifier que l'URL du webhook est correcte sur le dashboard Stripe.

## 📄 Licence

Ce projet est fourni tel quel, sans garantie.

## 👨‍💻 Support

Pour toute question ou problème :
- Créer une issue sur GitHub
- Contacter : support@propriofinder.com

---

**Développé avec Next.js, Prisma, Stripe, et Dropcontact** 🚀
