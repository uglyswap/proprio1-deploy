# 🚀 Guide de Démarrage Rapide (Tests Locaux)

Guide ultra-rapide pour tester ProprioFinder en local avec PostgreSQL et Redis sur votre serveur.

## ⚡ Démarrage en 5 minutes

### 1. Installer les dépendances

```bash
npm install
```

### 2. Créer le fichier .env

```bash
cp .env.example .env
```

### 3. Éditer .env avec vos credentials

**Minimum requis pour tester :**

```bash
# PostgreSQL sur votre serveur
DATABASE_URL="postgresql://user:password@votre-serveur:5432/proprio_finder"

# NextAuth (générer avec: openssl rand -base64 32)
NEXTAUTH_SECRET="votre-secret-genere-ici"

# Redis sur votre serveur
REDIS_URL="redis://votre-serveur:6379"
REDIS_HOST="votre-serveur"
REDIS_PORT="6379"

# Stripe (mode test - optionnel pour UI uniquement)
NEXT_PUBLIC_STRIPE_BASIC_PRICE_ID="price_test"
NEXT_PUBLIC_STRIPE_PRO_PRICE_ID="price_test"
NEXT_PUBLIC_STRIPE_ENTERPRISE_PRICE_ID="price_test"
```

**Note :** Pour tester sans Stripe, commentez les lignes Stripe ou mettez des valeurs bidon. Les pages publiques (landing, pricing, auth) fonctionneront parfaitement.

### 4. Initialiser la base de données

```bash
# Pousser le schéma Prisma vers PostgreSQL
npm run db:push

# Générer le client Prisma
npm run db:generate
```

### 5. Lancer l'application

```bash
# Lancer Next.js en mode dev
npm run dev
```

Ouvrir **http://localhost:3000** 🎉

---

## 🎨 Tester les nouvelles pages UI/UX

Toutes ces pages fonctionnent **sans backend** :

- **Landing page** : `http://localhost:3000/`
- **Pricing** : `http://localhost:3000/pricing`
- **Signup** : `http://localhost:3000/auth/signup`
- **Signin** : `http://localhost:3000/auth/signin`

Ces pages ont été complètement refaites avec :
- ✅ Framework AIDA (Attention, Interest, Desire, Action)
- ✅ Design moderne (glassmorphism, gradients)
- ✅ Testimonials et social proof
- ✅ FAQ interactifs
- ✅ Mobile responsive

**Aucune configuration supplémentaire nécessaire** pour voir le design !

---

## 🔧 Tests avancés (avec backend)

### Lancer le worker d'enrichissement (optionnel)

```bash
# Dans un terminal séparé
npm run worker
```

### Lancer Stripe CLI pour webhooks (optionnel)

```bash
# Dans un terminal séparé
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```

### Ouvrir Prisma Studio (visualiser la DB)

```bash
npm run db:studio
# Ouvre http://localhost:5555
```

---

## 📝 Checklist Tests

### Tests UI (sans backend)
- [ ] Landing page affiche correctement
- [ ] Pricing page affiche 3 plans (€29, €99, €349)
- [ ] Signup form fonctionne (validation frontend)
- [ ] Signin form fonctionne (validation frontend)
- [ ] Navbar sticky fonctionne
- [ ] Footer avec liens fonctionne
- [ ] Responsive mobile OK

### Tests Backend (avec PostgreSQL + Redis)
- [ ] Inscription crée un user + organisation
- [ ] Connexion fonctionne
- [ ] Dashboard accessible après login
- [ ] Recherche par adresse fonctionne
- [ ] Système de crédits débite correctement (10 crédits = 1 résultat)
- [ ] Export CSV télécharge

### Tests Stripe (optionnel)
- [ ] Checkout Stripe fonctionne
- [ ] Webhook reçoit les événements
- [ ] Crédits ajoutés après paiement
- [ ] Portal Stripe fonctionne

---

## 🐛 Dépannage Rapide

### Erreur "Inter font failed to fetch"
**Normal en local sans Internet**. En production avec Internet, ça marche.

### Erreur "Can't connect to database"
Vérifier que PostgreSQL est accessible :
```bash
psql $DATABASE_URL
```

### Erreur "Redis connection refused"
Vérifier que Redis tourne :
```bash
redis-cli -h votre-serveur ping
# Doit répondre PONG
```

### Page blanche
Vérifier la console browser (F12) et terminal Next.js pour les erreurs.

---

## 📊 Que tester en priorité ?

### 1. **Pages publiques (0 config)** 🎨
Directement accessibles sans rien configurer :
- Landing, Pricing, Auth pages
- **But :** Valider le nouveau design AIDA

### 2. **Authentification (PostgreSQL requis)** 🔐
Avec juste PostgreSQL configuré :
- Signup → crée user + org
- Signin → login fonctionne
- **But :** Valider le flow d'inscription

### 3. **Système de crédits (PostgreSQL + Stripe)** 💰
Avec Stripe en mode test :
- Acheter un plan
- Vérifier crédits ajoutés
- **But :** Valider tarification (10 crédits = 1 résultat)

### 4. **Recherches (PostgreSQL + données)** 🔍
Avec des données dans votre table PostgreSQL :
- Recherche par adresse
- Estimation → Validation → Exécution
- Export CSV
- **But :** Valider le flow complet

---

## ✅ Configuration actuelle

Votre setup est **parfait pour tests** :
- ✅ PostgreSQL sur votre serveur
- ✅ Redis sur votre serveur
- ✅ .env.example complet
- ✅ README détaillé
- ✅ Scripts npm configurés
- ✅ Code sans erreurs (2 commits pushés)

**Vous pouvez commencer les tests immédiatement !** 🚀
