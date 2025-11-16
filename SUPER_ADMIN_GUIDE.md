# 👑 Guide Super Admin - ProprioFinder

Ce guide est pour **VOUS**, l'opérateur du SaaS. Interface **no-code** pour tout gérer facilement.

## 🔑 Accès Super Admin

### 1. Devenir Super Admin

Après avoir créé votre compte, connectez-vous à la base de données et activez le flag :

```sql
UPDATE "User"
SET "isSuperAdmin" = true
WHERE email = 'votre-email@domain.com';
```

Ou via Prisma Studio :
```bash
npx prisma studio
# → Ouvrir la table User
# → Trouver votre compte
# → Mettre isSuperAdmin à true
```

### 2. Accéder au Dashboard Super Admin

Une fois super admin, accédez à : **`/superadmin`**

Vous verrez un dashboard rouge avec sidebar de navigation.

---

## 📊 Dashboard Principal (`/superadmin`)

Aperçu de votre business :
- **MRR** (Monthly Recurring Revenue)
- **ARR** (Annual Recurring Revenue)
- **Clients actifs**
- **Profit** (Revenue - Coûts API)
- **Répartition par plan**

---

## 👥 Gestion des Clients (`/superadmin/clients`)

### Fonctionnalités :
- ✅ Liste de tous vos clients
- ✅ Stats par client (crédits, recherches, membres)
- ✅ Filtres (par plan, statut)
- ✅ **Impersonation** : Se connecter en tant qu'un client (support)

### Impersonation :
1. Cliquer sur l'icône "Impersonate" (👤) à côté du client
2. Vous êtes maintenant connecté comme ce client
3. Vous voyez exactement ce qu'il voit
4. Pour revenir : cliquer sur "Retour au dashboard client" dans la sidebar

---

## 💳 Configuration Stripe (`/superadmin/stripe`)

### Étape 1 : Obtenir vos clés Stripe

1. Aller sur https://dashboard.stripe.com/apikeys
2. Copier :
   - **Secret Key** (sk_test_... ou sk_live_...)
   - **Publishable Key** (pk_test_... ou pk_live_...)

### Étape 2 : Configurer le Webhook

1. Aller sur https://dashboard.stripe.com/webhooks
2. Cliquer "Add endpoint"
3. URL : `https://votre-domaine.com/api/webhooks/stripe`
4. Événements à écouter :
   - ✅ `checkout.session.completed`
   - ✅ `invoice.payment_succeeded`
   - ✅ `customer.subscription.created`
   - ✅ `customer.subscription.updated`
   - ✅ `customer.subscription.deleted`
5. Copier le **Webhook Secret** (whsec_...)

### Étape 3 : Enregistrer dans ProprioFinder

1. Aller sur `/superadmin/stripe`
2. Coller vos 3 clés
3. Cliquer "Tester la connexion" → doit afficher ✅
4. Cliquer "Enregistrer" → **Chiffrement automatique** ✅

---

## 🗄️ Sources de Données (`/superadmin/datasources`)

**C'est le cœur de votre SaaS !** Connectez vos bases PostgreSQL.

### Étape 1 : Préparer vos bases

Vous avez besoin de **2 bases minimum** :

#### Base 1 : Propriétaires (personnes morales)
Table avec colonnes minimum :
- `adresse` - Adresse du bien
- `code_postal` - Code postal
- `ville` - Ville
- `siren` - SIREN du propriétaire (9 chiffres)
- `proprietaire` - Nom du propriétaire
- `latitude`, `longitude` - Coordonnées GPS
- `section`, `numero_parcelle` - Référence cadastre

#### Base 2 : SIRENE (annuaire entreprises)
Table avec colonnes minimum :
- `siren` - SIREN (9 chiffres) **← CLÉ DE CROISEMENT**
- `denomination` - Nom de l'entreprise
- `dirigeant_nom` - Nom du dirigeant
- `dirigeant_prenom` - Prénom du dirigeant
- `dirigeant_qualite` - Qualité (Président, Gérant, etc.)
- `siege_adresse` - Adresse du siège
- `siege_code_postal` - Code postal du siège
- `siege_ville` - Ville du siège

### Étape 2 : Ajouter les sources dans ProprioFinder

1. Aller sur `/superadmin/datasources`
2. Cliquer "Ajouter une source"

**Pour la base Propriétaires** :
```
Nom : Base Propriétaires
Hôte : votre-serveur.com (ou IP)
Port : 5432
Database : nom_de_la_base
Utilisateur : postgres (ou autre)
Mot de passe : ••••••••
Schéma : public
Table : proprietaires_personnes_morales
```

3. Cliquer "Tester la connexion"
   - ✅ Affiche le nombre d'enregistrements
   - ❌ Affiche l'erreur si connexion impossible

4. Cliquer "Enregistrer" → **Mot de passe chiffré** ✅

**Répéter pour la base SIRENE** :
```
Nom : SIRENE
Hôte : votre-serveur.com
...
Table : entreprises
```

### Étape 3 : Activer les sources

Une fois testées et enregistrées :
- Cliquer sur le bouton "Activer" (▶️)
- Status passe de INACTIVE → ACTIVE ✅

**C'est tout !** Le système utilise automatiquement vos sources pour :
1. Chercher dans la base Propriétaires
2. Croiser avec SIRENE via le SIREN
3. Retourner : Propriété + Société + Dirigeant

---

## 🔌 APIs Externes (`/superadmin/apis`)

### Dropcontact (enrichissement contacts)

1. Aller sur `/superadmin/apis`
2. Section "Dropcontact API"
3. Coller votre clé API Dropcontact
4. Configurer le coût (par défaut 5 crédits par contact enrichi)
5. Activer/désactiver avec le switch
6. Enregistrer → **Chiffrement automatique** ✅

---

## 💰 Plans & Tarifs (`/superadmin/plans`)

### Vue d'ensemble

Gérez vos offres d'abonnement :
- FREE - 0€ (0 crédit)
- BASIC - 29€ (500 crédits)
- PRO - 99€ (3 000 crédits)
- ENTERPRISE - 349€ (20 000 crédits)

### Modifier un plan

1. Cliquer sur l'icône "Modifier" (✏️)
2. Changer les paramètres :
   - Prix mensuel/annuel
   - Crédits mensuels
   - Membres max
   - Enrichissement (ON/OFF)
   - API Access (ON/OFF)
3. Enregistrer

### Créer un plan personnalisé

1. Cliquer "Créer un plan"
2. Remplir :
   - Nom du plan
   - Prix
   - Crédits
   - Fonctionnalités
3. Activer/désactiver
4. Afficher/masquer sur la page pricing

### Paramètres Globaux

- **Crédits par résultat** : Par défaut 10 crédits = 1 ligne
- **Reset mensuel** : Activé (crédits se rechargent, pas d'accumulation)

---

## 📈 Analytics (`/superadmin/analytics`)

Visualisez vos métriques SaaS :

### Graphiques disponibles :
- **Revenue, Coûts & Profit** (ligne multi)
- **Évolution Clients** (area)
- **Nouveaux Clients vs Churn** (bar)
- **Recherches par jour** (bar)
- **Crédits consommés** (area)

### Métriques clés (30 jours) :
- ARR (Annual Recurring Revenue)
- Nouveaux clients
- Churn (clients perdus)
- Coûts API totaux

---

## 📋 Logs d'Audit (`/superadmin/logs`)

Traçabilité complète de toutes les actions :

### Filtre par :
- Type d'action (LOGIN, SEARCH, CONFIG_CHANGE, etc.)
- Entité (User, Organization, SystemConfig, etc.)
- Date

### Colonnes affichées :
- Date et heure
- Action
- Utilisateur
- Entité modifiée
- Description
- Adresse IP

---

## 🔄 Reset Mensuel des Crédits (CRON)

**Important** : Les crédits **NE s'accumulent PAS**. Ils se rechargent chaque mois.

### Configuration CRON

#### Option 1 : Vercel (Recommandé si déployé sur Vercel)

Le fichier `vercel.json` est déjà configuré :
```json
{
  "crons": [{
    "path": "/api/cron/reset-credits",
    "schedule": "0 2 * * *"
  }]
}
```

✅ **Rien à faire !** Vercel appelle automatiquement à 2h du matin chaque jour.

#### Option 2 : Serveur Linux (crontab)

```bash
# Éditer crontab
crontab -e

# Ajouter cette ligne :
0 2 * * * /home/user/proprio1/scripts/cron-reset-credits.sh
```

Le script utilise curl pour appeler `/api/cron/reset-credits`.

#### Option 3 : GitHub Actions

Créer `.github/workflows/cron.yml` :
```yaml
name: Reset Credits
on:
  schedule:
    - cron: '0 2 * * *'
jobs:
  reset:
    runs-on: ubuntu-latest
    steps:
      - run: |
          curl -X GET \
            -H "Authorization: Bearer ${{ secrets.CRON_SECRET }}" \
            ${{ secrets.APP_URL }}/api/cron/reset-credits
```

### Sécurité CRON

L'API CRON est protégée par un secret :

```bash
# Générer un secret
openssl rand -base64 32

# Ajouter dans .env
CRON_SECRET="votre-secret-genere"
```

---

## 🔒 Sécurité

### Données chiffrées

Toutes les données sensibles sont chiffrées avec **AES-256-GCM** :
- ✅ Mots de passe bases de données
- ✅ Clés API (Stripe, Dropcontact)
- ✅ Webhook secrets

### Génération du secret de chiffrement

```bash
openssl rand -base64 32
```

Ajouter dans `.env` :
```
ENCRYPTION_SECRET="votre-secret-genere"
```

⚠️ **Ne jamais partager ce secret !**

### Audit complet

Toutes vos actions sont loguées dans la table `AuditLog` :
- Qui a fait quoi
- Quand
- Sur quelle entité
- Avec quelle IP

---

## 🎯 Workflow Complet

### 1. Configuration Initiale (une seule fois)

```
1. Devenir super admin (SQL)
2. Configurer Stripe (/superadmin/stripe)
3. Ajouter sources de données (/superadmin/datasources)
4. Tester les connexions
5. Activer les sources
6. (Optionnel) Configurer Dropcontact
7. Vérifier les plans (/superadmin/plans)
```

### 2. Utilisation Quotidienne

```
- Vérifier dashboard (/superadmin)
- Consulter analytics (/superadmin/analytics)
- Gérer les clients (/superadmin/clients)
- Support via impersonation
- Consulter logs si besoin
```

### 3. Vos Clients Utilisent le SaaS

```
Client → Recherche → Estimation GRATUITE
       ↓
   Validation (accepte le coût)
       ↓
   Exécution :
       - Requête base Propriétaires
       - Croisement SIRENE (SIREN)
       - Résultat : Propriété + Société + Dirigeant
       - Débit : 10 crédits × nombre de résultats
       ↓
   Téléchargement CSV
```

---

## 🆘 Dépannage

### "Sources de données non configurées"

→ Aller sur `/superadmin/datasources`
→ Vérifier que les sources sont en statut ACTIVE
→ Tester les connexions

### "Stripe webhook ne fonctionne pas"

→ Vérifier webhook configuré sur dashboard.stripe.com
→ URL doit être `https://votre-domaine.com/api/webhooks/stripe`
→ Webhook secret doit être enregistré dans `/superadmin/stripe`

### "CRON ne s'exécute pas"

→ Vérifier vercel.json est déployé
→ Ou vérifier crontab avec `crontab -l`
→ Tester manuellement : `curl https://votre-domaine.com/api/cron/reset-credits`

### "Impossible de se connecter à une base de données"

→ Vérifier que la base autorise les connexions externes
→ Vérifier firewall/sécurité
→ Vérifier credentials (user/password)
→ Tester avec `psql -h HOST -U USER -d DATABASE`

---

## 📞 Support

Questions ? Problèmes ?

1. Consulter les logs d'audit (`/superadmin/logs`)
2. Vérifier la console serveur (logs)
3. Tester les connexions DB
4. Contacter le support technique

---

**Vous êtes prêt ! 🚀**

Votre SaaS ProprioFinder est maintenant **100% opérationnel** et prêt à générer du revenue.
