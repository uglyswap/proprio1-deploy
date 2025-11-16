# 🚀 Guide de Déploiement ProprioFinder

Ce guide vous explique comment déployer ProprioFinder en production.

## ✅ Prérequis

- Node.js 18+ installé
- PostgreSQL 14+ installé et configuré
- Redis 6+ installé
- Compte Stripe (pour les paiements)
- Compte Dropcontact (optionnel, pour l'enrichissement)

## 📦 Installation Rapide (Développement)

```bash
# 1. Installer les dépendances
npm install

# 2. Copier et configurer .env
cp .env.example .env
# Éditer .env avec vos valeurs

# 3. Initialiser la base de données
npm run db:push
npm run db:generate

# 4. Peupler avec données de test
npm run db:seed

# 5. Lancer l'application (3 terminaux)

# Terminal 1: Next.js
npm run dev

# Terminal 2: Redis
docker run -d -p 6379:6379 redis:7-alpine
# OU si installé localement:
redis-server

# Terminal 3: Worker d'enrichissement
npm run worker

# Terminal 4 (optionnel): Stripe CLI pour webhooks
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```

Ouvrir http://localhost:3000

## 🔐 Comptes de Test (après seed)

```
Admin ENTERPRISE:
- Email: admin@propriofinder.com
- Password: admin123
- Crédits: 50,000

Utilisateur PRO:
- Email: jean@test.com
- Password: admin123
- Crédits: 3,000

Utilisateur BASIC:
- Email: marie@test.com
- Password: admin123
- Crédits: 500

Utilisateur FREE:
- Email: pierre@test.com
- Password: admin123
- Crédits: 100
```

## ⚙️ Configuration Stripe

### 1. Créer un compte Stripe

1. Aller sur https://dashboard.stripe.com
2. Créer un compte
3. Récupérer les clés API (mode test d'abord)

### 2. Créer les produits

Dans le dashboard Stripe, créer 3 produits récurrents (mensuels) :

| Produit | Prix | Description |
|---------|------|-------------|
| Basic | 29€/mois | 500 crédits inclus |
| Pro | 99€/mois | 3,000 crédits inclus |
| Enterprise | 349€/mois | 20,000 crédits inclus |

Pour chaque produit, copier le **Price ID** (commence par `price_...`)

### 3. Configurer les webhooks

**En développement:**
```bash
stripe login
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```

Copier le `webhook secret` affiché (commence par `whsec_...`)

**En production:**

1. Dans le dashboard Stripe, aller dans "Developers" → "Webhooks"
2. Cliquer "Add endpoint"
3. URL: `https://votre-domaine.com/api/webhooks/stripe`
4. Sélectionner ces événements:
   - `checkout.session.completed`
   - `invoice.payment_succeeded`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
5. Copier le `Signing secret`

### 4. Mettre à jour .env

```bash
STRIPE_SECRET_KEY="sk_test_..." # ou sk_live_ en production
STRIPE_PUBLISHABLE_KEY="pk_test_..." # ou pk_live_ en production
STRIPE_WEBHOOK_SECRET="whsec_..."

STRIPE_BASIC_PRICE_ID="price_..."
STRIPE_PRO_PRICE_ID="price_..."
STRIPE_ENTERPRISE_PRICE_ID="price_..."
```

## 🗄️ Configuration Base de Données

### PostgreSQL avec vos données existantes

Si vous avez déjà une base PostgreSQL avec des données immobilières:

1. **Adaptez le nom de la table** dans les fichiers:
   - `app/api/search/estimate/route.ts`
   - `app/api/search/execute/route.ts`

   Remplacez `your_properties_table` par votre vrai nom de table.

2. **Vérifiez les colonnes requises**:

   Votre table doit avoir (au minimum):
   ```sql
   - adresse (VARCHAR)
   - code_postal (VARCHAR)
   - ville (VARCHAR)
   - code_commune (VARCHAR)
   - proprietaire (VARCHAR)
   - siren (VARCHAR, optionnel)
   - company_name (VARCHAR, optionnel)
   - type_local (VARCHAR, optionnel)
   - surface (DECIMAL, optionnel)
   - latitude (DECIMAL)
   - longitude (DECIMAL)
   - section (VARCHAR, optionnel)
   - numero_parcelle (VARCHAR, optionnel)
   ```

3. **Ajoutez des index pour la performance**:
   ```sql
   CREATE INDEX idx_coords ON your_properties_table(latitude, longitude);
   CREATE INDEX idx_postal ON your_properties_table(code_postal);
   CREATE INDEX idx_siren ON your_properties_table(siren);
   CREATE INDEX idx_commune ON your_properties_table(code_commune);
   ```

## 🌐 Déploiement Production

### Option 1: Vercel (Recommandé - Le plus simple)

```bash
# 1. Installer Vercel CLI
npm i -g vercel

# 2. Se connecter
vercel login

# 3. Déployer
vercel

# 4. Configurer les variables d'environnement
# Dans le dashboard Vercel > Settings > Environment Variables
# Ajouter toutes les variables de .env

# 5. Redéployer
vercel --prod
```

**⚠️ Important pour Vercel:**
- Le worker d'enrichissement ne peut PAS tourner sur Vercel
- Soit désactiver l'enrichissement
- Soit héberger le worker ailleurs (voir ci-dessous)

### Option 2: VPS (Ubuntu/Debian) - Complet

```bash
# 1. Connectez-vous à votre serveur
ssh user@votre-serveur.com

# 2. Installer Node.js, PostgreSQL, Redis
sudo apt update
sudo apt install nodejs npm postgresql redis-server nginx

# 3. Cloner le projet
git clone https://github.com/votre-username/proprio1.git
cd proprio1

# 4. Installer les dépendances
npm install

# 5. Créer .env avec les vraies valeurs

# 6. Build
npm run build

# 7. Installer PM2 pour gérer les processus
npm install -g pm2

# 8. Lancer les services
pm2 start npm --name "proprio-web" -- start
pm2 start npm --name "proprio-worker" -- run worker

# 9. Sauvegarder la config PM2
pm2 save
pm2 startup

# 10. Configurer Nginx
sudo nano /etc/nginx/sites-available/propriofinder

# Contenu:
server {
    listen 80;
    server_name votre-domaine.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}

# Activer
sudo ln -s /etc/nginx/sites-available/propriofinder /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx

# 11. SSL avec Let's Encrypt
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d votre-domaine.com
```

### Option 3: Docker

```bash
# 1. Créer Dockerfile
cat > Dockerfile <<EOF
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

EXPOSE 3000

CMD ["npm", "start"]
EOF

# 2. Créer docker-compose.yml
cat > docker-compose.yml <<EOF
version: '3.8'

services:
  web:
    build: .
    ports:
      - "3000:3000"
    environment:
      - DATABASE_URL=\${DATABASE_URL}
      - NEXTAUTH_SECRET=\${NEXTAUTH_SECRET}
      - STRIPE_SECRET_KEY=\${STRIPE_SECRET_KEY}
      - REDIS_URL=redis://redis:6379
    depends_on:
      - postgres
      - redis

  worker:
    build: .
    command: npm run worker
    environment:
      - DATABASE_URL=\${DATABASE_URL}
      - REDIS_URL=redis://redis:6379
      - DROPCONTACT_API_KEY=\${DROPCONTACT_API_KEY}
    depends_on:
      - redis

  postgres:
    image: postgres:14-alpine
    environment:
      - POSTGRES_PASSWORD=\${DB_PASSWORD}
      - POSTGRES_DB=propriofinder
    volumes:
      - postgres_data:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine
    volumes:
      - redis_data:/data

volumes:
  postgres_data:
  redis_data:
EOF

# 3. Lancer
docker-compose up -d
```

## 🔒 Checklist de Production

Avant de mettre en production, vérifier:

- [ ] `NEXTAUTH_SECRET` est une vraie valeur aléatoire (générer avec `openssl rand -base64 32`)
- [ ] `NEXTAUTH_URL` pointe vers votre domaine en production
- [ ] Les clés Stripe sont en mode LIVE (pas test)
- [ ] Le webhook Stripe est configuré sur l'URL de production
- [ ] PostgreSQL est sécurisé (pas de mot de passe par défaut)
- [ ] Redis est sécurisé (password configuré si exposé)
- [ ] SSL/HTTPS est activé
- [ ] Les variables d'environnement sont bien configurées
- [ ] Le worker d'enrichissement tourne
- [ ] Les backups PostgreSQL sont configurés

## 📊 Monitoring

### Logs

```bash
# PM2
pm2 logs
pm2 logs proprio-web
pm2 logs proprio-worker

# Docker
docker-compose logs -f
docker-compose logs -f web
docker-compose logs -f worker
```

### Santé de l'application

- Page web: `https://votre-domaine.com`
- Vérifier que la connexion fonctionne
- Tester une recherche
- Vérifier que l'enrichissement fonctionne (si activé)

### Stripe

- Vérifier que les webhooks arrivent bien
- Dashboard Stripe > Developers > Webhooks > Voir les événements

## 🐛 Dépannage

### "your_properties_table" n'existe pas

→ Remplacez dans `app/api/search/estimate/route.ts` et `app/api/search/execute/route.ts`

### Worker ne démarre pas

→ Vérifier que Redis tourne: `redis-cli ping` (doit répondre PONG)

### Webhooks Stripe ne fonctionnent pas

→ Vérifier l'URL du webhook dans le dashboard Stripe
→ Vérifier que `STRIPE_WEBHOOK_SECRET` est correct

### Enrichissement ne fonctionne pas

→ Vérifier que `DROPCONTACT_API_KEY` est configurée
→ Vérifier que le worker tourne
→ Vérifier les logs du worker

## 📞 Support

Pour toute question:
- Documentation: README.md
- Issues GitHub: https://github.com/votre-username/proprio1/issues
