# 🚀 ProprioFinder - Guide de Déploiement

## Déploiement Ultra-Rapide avec Docker

### Prérequis

- Docker 20+ installé
- Docker Compose 2+ installé
- 2GB RAM minimum (4GB recommandé)
- 10GB d'espace disque

### 🎯 Déploiement en 1 commande

```bash
./setup.sh
```

C'est tout ! Le script va :
1. ✅ Vérifier Docker et Docker Compose
2. ✅ Générer `.env.production` avec des secrets sécurisés
3. ✅ Build les images Docker
4. ✅ Démarrer PostgreSQL et Redis
5. ✅ Migrer la base de données
6. ✅ Démarrer l'application et le worker

### 📝 Configuration Manuelle

Si vous préférez configurer manuellement :

1. **Copier le fichier d'environnement**
```bash
cp .env.production.example .env.production
```

2. **Éditer `.env.production`**
```bash
nano .env.production
```

Configurez au minimum :
- `NEXTAUTH_SECRET` (générez avec `openssl rand -base64 32`)
- `STRIPE_SECRET_KEY` et `STRIPE_PUBLISHABLE_KEY`
- `DROPCONTACT_API_KEY`
- `DB_PASSWORD` et `REDIS_PASSWORD`

3. **Build et démarrer**
```bash
docker-compose build
docker-compose up -d
docker-compose run --rm app npx prisma db push
```

### 🔍 Vérifier le déploiement

```bash
# Voir les logs
docker-compose logs -f

# Vérifier le statut
docker-compose ps

# Tester le health check
curl http://localhost:3000/api/health
```

### 🎛️ Commandes Utiles

```bash
# Arrêter tous les services
docker-compose down

# Redémarrer
docker-compose restart

# Voir les logs d'un service spécifique
docker-compose logs -f app

# Accéder au shell de l'app
docker-compose exec app sh

# Backup de la base de données
docker-compose exec postgres pg_dump -U proprio_user proprio_finder > backup.sql

# Restaurer un backup
cat backup.sql | docker-compose exec -T postgres psql -U proprio_user proprio_finder
```

### 🔐 Sécurité

**IMPORTANT** : Avant la production

1. ✅ Changez tous les mots de passe par défaut
2. ✅ Utilisez HTTPS (configurez nginx avec Let's Encrypt)
3. ✅ Configurez un firewall
4. ✅ Activez les backups automatiques
5. ✅ Limitez l'accès SSH

### 🌐 Production avec HTTPS (Nginx + Let's Encrypt)

```bash
# Démarrer avec nginx
docker-compose --profile with-nginx up -d

# Obtenir un certificat SSL
docker-compose exec nginx certbot --nginx -d your-domain.com
```

### 📊 Monitoring

**Logs structurés** : Tous les logs sont en JSON pour faciliter l'intégration avec :
- ELK Stack
- Datadog
- New Relic
- Sentry

**Métriques** : Le dashboard SuperAdmin affiche :
- MRR, ARR, Churn
- Clients actifs
- Recherches et crédits
- Coûts API

### 🔄 Mises à jour

```bash
# Pull les dernières modifications
git pull origin main

# Rebuild et redémarrer
docker-compose build
docker-compose up -d

# Migrer la DB si nécessaire
docker-compose run --rm app npx prisma db push
```

### ☁️ Déploiement Cloud

#### **Vercel** (Recommandé pour Next.js)
```bash
vercel --prod
```

#### **Railway**
```bash
railway up
```

#### **AWS / GCP / Azure**
Utilisez les fichiers Docker fournis avec :
- AWS ECS / Fargate
- Google Cloud Run
- Azure Container Instances

### 🆘 Dépannage

**Port déjà utilisé ?**
```bash
# Changer le port dans docker-compose.yml
ports:
  - "8000:3000"  # Au lieu de 3000:3000
```

**Problème de migration Prisma ?**
```bash
docker-compose run --rm app npx prisma migrate reset
docker-compose run --rm app npx prisma db push
```

**Redis connection failed ?**
```bash
# Vérifier que Redis est démarré
docker-compose ps redis

# Redémarrer Redis
docker-compose restart redis
```

### 📞 Support

- 📖 Documentation : `/docs`
- 🐛 Issues : GitHub Issues
- 💬 Discord : [Lien Discord]

---

**Fait avec ❤️ par le meilleur dev fullstack du monde** 🔥
