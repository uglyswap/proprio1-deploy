import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcrypt'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Début du seed...')

  // Clean database
  await prisma.property.deleteMany()
  await prisma.search.deleteMany()
  await prisma.creditTransaction.deleteMany()
  await prisma.subscription.deleteMany()
  await prisma.enrichmentLog.deleteMany()
  await prisma.organizationUser.deleteMany()
  await prisma.organization.deleteMany()
  await prisma.session.deleteMany()
  await prisma.account.deleteMany()
  await prisma.user.deleteMany()

  console.log('✅ Base de données nettoyée')

  // Create admin user
  const hashedPassword = await bcrypt.hash('admin123', 10)

  const adminUser = await prisma.user.create({
    data: {
      name: 'Admin Demo',
      email: 'admin@propriofinder.com',
      password: hashedPassword,
    },
  })

  const adminOrg = await prisma.organization.create({
    data: {
      name: 'ProprioFinder Admin',
      slug: 'proprio-admin',
      plan: 'ENTERPRISE',
      creditBalance: 50000,
    },
  })

  await prisma.organizationUser.create({
    data: {
      organizationId: adminOrg.id,
      userId: adminUser.id,
      role: 'OWNER',
    },
  })

  await prisma.creditTransaction.create({
    data: {
      organizationId: adminOrg.id,
      amount: 50000,
      type: 'ADJUSTMENT',
      description: 'Crédits initiaux admin',
    },
  })

  console.log('✅ Utilisateur admin créé: admin@propriofinder.com / admin123')

  // Create test users
  const testUsers = [
    {
      name: 'Jean Dupont',
      email: 'jean@test.com',
      orgName: 'Agence Dupont Immobilier',
      plan: 'PRO' as const,
      credits: 3000,
    },
    {
      name: 'Marie Martin',
      email: 'marie@test.com',
      orgName: 'Martin Investissements',
      plan: 'BASIC' as const,
      credits: 500,
    },
    {
      name: 'Pierre Bernard',
      email: 'pierre@test.com',
      orgName: 'Bernard Conseil',
      plan: 'FREE' as const,
      credits: 100,
    },
  ]

  for (const userData of testUsers) {
    const user = await prisma.user.create({
      data: {
        name: userData.name,
        email: userData.email,
        password: hashedPassword,
      },
    })

    const org = await prisma.organization.create({
      data: {
        name: userData.orgName,
        slug: userData.orgName.toLowerCase().replace(/[^a-z0-9]+/g, '-') + '-' + Math.random().toString(36).substring(7),
        plan: userData.plan,
        creditBalance: userData.credits,
      },
    })

    await prisma.organizationUser.create({
      data: {
        organizationId: org.id,
        userId: user.id,
        role: 'OWNER',
      },
    })

    await prisma.creditTransaction.create({
      data: {
        organizationId: org.id,
        amount: userData.credits,
        type: 'SUBSCRIPTION',
        description: `Crédits ${userData.plan}`,
      },
    })

    // Create some sample searches
    const search1 = await prisma.search.create({
      data: {
        organizationId: org.id,
        userId: user.id,
        type: 'BY_ADDRESS',
        status: 'COMPLETED',
        criteria: {
          adresse: '12 Rue de Rivoli',
          codePostal: '75001',
        },
        estimatedRows: 3,
        estimatedCost: 3,
        actualRows: 3,
        actualCost: 3,
        completedAt: new Date(),
        validatedAt: new Date(Date.now() - 1000 * 60),
        createdAt: new Date(Date.now() - 1000 * 60 * 2),
      },
    })

    await prisma.creditTransaction.create({
      data: {
        organizationId: org.id,
        amount: -3,
        type: 'SEARCH_COST',
        description: 'Recherche par adresse',
        searchId: search1.id,
      },
    })

    // Add sample properties for the search
    await prisma.property.createMany({
      data: [
        {
          searchId: search1.id,
          adresse: '12 Rue de Rivoli',
          codePostal: '75001',
          ville: 'Paris 1er',
          codeCommune: '75101',
          proprietaire: 'SCI RIVOLI',
          siren: '123456789',
          companyName: 'SCI RIVOLI',
          typeLocal: 'Commercial',
          surface: 250.50,
          latitude: 48.8566,
          longitude: 2.3522,
        },
        {
          searchId: search1.id,
          adresse: '12 Rue de Rivoli',
          codePostal: '75001',
          ville: 'Paris 1er',
          codeCommune: '75101',
          proprietaire: 'DUPONT Jean',
          siren: null,
          companyName: null,
          typeLocal: 'Appartement',
          surface: 85.00,
          latitude: 48.8566,
          longitude: 2.3522,
        },
        {
          searchId: search1.id,
          adresse: '12 Rue de Rivoli',
          codePostal: '75001',
          ville: 'Paris 1er',
          codeCommune: '75101',
          proprietaire: 'MARTIN Sophie',
          siren: null,
          companyName: null,
          typeLocal: 'Appartement',
          surface: 62.00,
          latitude: 48.8566,
          longitude: 2.3522,
        },
      ],
    })

    console.log(`✅ Utilisateur créé: ${userData.email} / admin123`)
  }

  console.log('')
  console.log('🎉 Seed terminé avec succès!')
  console.log('')
  console.log('📧 Comptes de test créés:')
  console.log('  - admin@propriofinder.com / admin123 (ENTERPRISE - 50000 crédits)')
  console.log('  - jean@test.com / admin123 (PRO - 3000 crédits)')
  console.log('  - marie@test.com / admin123 (BASIC - 500 crédits)')
  console.log('  - pierre@test.com / admin123 (FREE - 100 crédits)')
  console.log('')
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })
