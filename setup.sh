#!/bin/bash

# ================================
# ProprioFinder - Setup Script
# Déploiement ultra-facile en 1 commande
# ================================

set -e

echo "🚀 ProprioFinder - Setup automatique"
echo "===================================="
echo ""

# Couleurs
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Vérifier Docker
if ! command -v docker &> /dev/null; then
    echo -e "${RED}❌ Docker n'est pas installé${NC}"
    echo "Installez Docker: https://docs.docker.com/get-docker/"
    exit 1
fi

if ! command -v docker-compose &> /dev/null; then
    echo -e "${RED}❌ Docker Compose n'est pas installé${NC}"
    echo "Installez Docker Compose: https://docs.docker.com/compose/install/"
    exit 1
fi

echo -e "${GREEN}✅ Docker et Docker Compose sont installés${NC}"
echo ""

# Générer .env.production si inexistant
if [ ! -f .env.production ]; then
    echo -e "${YELLOW}📝 Création du fichier .env.production${NC}"
    cp .env.production.example .env.production

    # Générer des secrets sécurisés
    NEXTAUTH_SECRET=$(openssl rand -base64 32)
    ENCRYPTION_SECRET=$(openssl rand -base64 32)
    CRON_SECRET=$(openssl rand -base64 32)
    DB_PASSWORD=$(openssl rand -base64 32)
    REDIS_PASSWORD=$(openssl rand -base64 32)

    # Remplacer dans .env.production
    sed -i.bak "s/generate_with_openssl_rand_base64_32/$NEXTAUTH_SECRET/g" .env.production
    sed -i.bak "s/your_secure_database_password_here/$DB_PASSWORD/g" .env.production
    sed -i.bak "s/your_secure_redis_password_here/$REDIS_PASSWORD/g" .env.production

    echo -e "${GREEN}✅ Fichier .env.production créé avec secrets générés${NC}"
    echo -e "${YELLOW}⚠️  IMPORTANT: Éditez .env.production et ajoutez vos clés Stripe et Dropcontact${NC}"
    echo ""
else
    echo -e "${GREEN}✅ Fichier .env.production existe déjà${NC}"
fi

# Charger les variables d'environnement
export $(cat .env.production | grep -v '^#' | xargs)

# Build des images Docker
echo -e "${YELLOW}🔨 Build des images Docker...${NC}"
docker-compose build --no-cache

echo -e "${GREEN}✅ Images Docker construites${NC}"
echo ""

# Démarrer les services
echo -e "${YELLOW}🚀 Démarrage des services...${NC}"
docker-compose up -d postgres redis

echo "⏳ Attente du démarrage de PostgreSQL et Redis..."
sleep 10

# Migration de la base de données
echo -e "${YELLOW}📊 Migration de la base de données...${NC}"
docker-compose run --rm app npx prisma db push
docker-compose run --rm app npx prisma generate

echo -e "${GREEN}✅ Base de données migrée${NC}"
echo ""

# Seed de la base de données (optionnel)
read -p "Voulez-vous seed la base de données avec des données de test ? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${YELLOW}🌱 Seeding de la base de données...${NC}"
    docker-compose run --rm app npm run db:seed
    echo -e "${GREEN}✅ Base de données seedée${NC}"
fi

# Démarrer tous les services
echo -e "${YELLOW}🚀 Démarrage de tous les services...${NC}"
docker-compose up -d

echo ""
echo -e "${GREEN}✅ Déploiement terminé !${NC}"
echo ""
echo "===================================="
echo "🎉 ProprioFinder est maintenant en ligne !"
echo ""
echo "📍 Application: http://localhost:3000"
echo "📊 Base de données: localhost:5432"
echo "🔴 Redis: localhost:6379"
echo ""
echo "🔍 Voir les logs: docker-compose logs -f"
echo "🛑 Arrêter: docker-compose down"
echo "🔄 Redémarrer: docker-compose restart"
echo ""
echo "⚠️  N'oubliez pas de:"
echo "   1. Configurer vos clés Stripe dans .env.production"
echo "   2. Configurer votre clé Dropcontact"
echo "   3. Créer votre premier utilisateur SuperAdmin"
echo ""
echo "===================================="
