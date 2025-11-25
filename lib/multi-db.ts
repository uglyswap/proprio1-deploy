/**
 * Service de connexion multi-bases de données PostgreSQL
 * Permet de se connecter à plusieurs sources de données externes
 */

import { Pool, PoolConfig } from 'pg'
import { decrypt } from './encryption'
import { prisma } from './prisma'

// Cache des pools de connexion
const connectionPools = new Map<string, Pool>()

/**
 * Récupère ou crée un pool de connexion pour une source de données
 */
export async function getDataSourcePool(dataSourceId: string): Promise<Pool> {
  // Vérifier le cache
  if (connectionPools.has(dataSourceId)) {
    return connectionPools.get(dataSourceId)!
  }

  // Récupérer la config depuis la DB
  const dataSource = await prisma.dataSource.findUnique({
    where: { id: dataSourceId },
  })

  if (!dataSource) {
    throw new Error(`Data source ${dataSourceId} not found`)
  }

  if (dataSource.status !== 'ACTIVE') {
    throw new Error(`Data source ${dataSourceId} is not active`)
  }

  if (dataSource.type !== 'POSTGRESQL') {
    throw new Error(`Data source ${dataSourceId} is not PostgreSQL`)
  }

  // Déchiffrer le mot de passe
  const password = dataSource.password ? decrypt(dataSource.password) : undefined

  // Créer le pool
  const poolConfig: PoolConfig = {
    host: dataSource.host || 'localhost',
    port: dataSource.port || 5432,
    database: dataSource.database || 'postgres',
    user: dataSource.username || undefined,
    password,
    max: 10, // Max 10 connexions par pool
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000,
  }

  const pool = new Pool(poolConfig)

  // Tester la connexion
  try {
    await pool.query('SELECT 1')
    connectionPools.set(dataSourceId, pool)
    return pool
  } catch (error) {
    await pool.end()
    throw new Error(`Failed to connect to data source: ${error}`)
  }
}

/**
 * Exécute une requête sur une source de données
 */
export async function queryDataSource(
  dataSourceId: string,
  query: string,
  params: any[] = []
) {
  const pool = await getDataSourcePool(dataSourceId)
  return pool.query(query, params)
}

/**
 * Teste une connexion à une source de données
 */
export async function testDataSourceConnection(dataSourceId: string): Promise<{
  success: boolean
  message: string
  recordCount?: number
}> {
  try {
    const dataSource = await prisma.dataSource.findUnique({
      where: { id: dataSourceId },
    })

    if (!dataSource) {
      return { success: false, message: 'Data source not found' }
    }

    const pool = await getDataSourcePool(dataSourceId)

    // Tester avec un SELECT 1
    await pool.query('SELECT 1')

    // Compter les enregistrements si une table est spécifiée
    let recordCount: number | undefined

    if (dataSource.tableName) {
      const schema = dataSource.schema || 'public'
      const countResult = await pool.query(
        `SELECT COUNT(*) as count FROM "${schema}"."${dataSource.tableName}"`
      )
      recordCount = parseInt(countResult.rows[0].count)
    }

    // Mettre à jour la source
    await prisma.dataSource.update({
      where: { id: dataSourceId },
      data: {
        lastTestedAt: new Date(),
        lastTestStatus: 'success',
        lastTestError: null,
        recordCount,
      },
    })

    return {
      success: true,
      message: 'Connection successful',
      recordCount,
    }
  } catch (error: any) {
    // Mettre à jour avec l'erreur
    await prisma.dataSource.update({
      where: { id: dataSourceId },
      data: {
        lastTestedAt: new Date(),
        lastTestStatus: 'error',
        lastTestError: error.message,
      },
    })

    return {
      success: false,
      message: error.message,
    }
  }
}

/**
 * Ferme toutes les connexions
 */
export async function closeAllPools() {
  const promises = Array.from(connectionPools.values()).map(pool => pool.end())
  await Promise.all(promises)
  connectionPools.clear()
}

/**
 * Récupère les colonnes d'une table
 */
export async function getTableColumns(dataSourceId: string): Promise<{
  column_name: string
  data_type: string
  is_nullable: string
}[]> {
  const dataSource = await prisma.dataSource.findUnique({
    where: { id: dataSourceId },
  })

  if (!dataSource || !dataSource.tableName) {
    throw new Error('Data source or table name not found')
  }

  const pool = await getDataSourcePool(dataSourceId)
  const schema = dataSource.schema || 'public'

  const result = await pool.query(
    `
    SELECT column_name, data_type, is_nullable
    FROM information_schema.columns
    WHERE table_schema = $1 AND table_name = $2
    ORDER BY ordinal_position
    `,
    [schema, dataSource.tableName]
  )

  return result.rows
}

/**
 * Preview des données d'une table
 */
export async function previewTableData(
  dataSourceId: string,
  limit: number = 10
): Promise<any[]> {
  const dataSource = await prisma.dataSource.findUnique({
    where: { id: dataSourceId },
  })

  if (!dataSource || !dataSource.tableName) {
    throw new Error('Data source or table name not found')
  }

  const pool = await getDataSourcePool(dataSourceId)
  const schema = dataSource.schema || 'public'

  const result = await pool.query(
    `SELECT * FROM "${schema}"."${dataSource.tableName}" LIMIT $1`,
    [limit]
  )

  return result.rows
}
