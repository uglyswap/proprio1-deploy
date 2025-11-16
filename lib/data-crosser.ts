/**
 * Service de croisement de données multi-sources
 * Croise les propriétaires avec SIRENE pour récupérer dirigeants
 */

import { queryDataSource } from './multi-db'
import { prisma } from './prisma'

export interface PropertyData {
  // Propriété
  adresse: string
  codePostal?: string
  ville?: string
  codeCommune?: string
  departement?: string

  // Propriétaire
  proprietaire: string
  siren?: string

  // Localisation
  latitude?: number
  longitude?: number

  // Cadastre
  section?: string
  numeroParcelle?: string
  typeLocal?: string
  surface?: number
}

export interface EnrichedPropertyData extends PropertyData {
  // Enrichissement SIRENE
  companyName?: string
  dirigeantNom?: string
  dirigeantPrenom?: string
  dirigeantQualite?: string
  siegeAdresse?: string
  siegeCodePostal?: string
  siegeVille?: string
}

/**
 * Récupère les sources de données actives par type
 */
async function getActiveSources() {
  const sources = await prisma.dataSource.findMany({
    where: { status: 'ACTIVE' },
    include: { mappings: true },
  })

  const proprietairesSource = sources.find(s =>
    s.name.toLowerCase().includes('propriétaire') ||
    s.name.toLowerCase().includes('cadastre')
  )

  const sireneSource = sources.find(s =>
    s.name.toLowerCase().includes('sirene') ||
    s.name.toLowerCase().includes('entreprise')
  )

  return { proprietairesSource, sireneSource }
}

/**
 * Construit un mapping de colonnes pour une source
 */
function buildColumnMapping(source: any): Map<string, string> {
  const mapping = new Map<string, string>()

  source.mappings.forEach((m: any) => {
    mapping.set(m.targetField, m.sourceColumn)
  })

  return mapping
}

/**
 * Recherche par adresse
 */
export async function searchByAddress(
  address: string,
  postalCode?: string
): Promise<EnrichedPropertyData[]> {
  const { proprietairesSource, sireneSource } = await getActiveSources()

  if (!proprietairesSource) {
    throw new Error('Source de données propriétaires non configurée')
  }

  const mapping = buildColumnMapping(proprietairesSource)
  const schema = proprietairesSource.schema || 'public'
  const table = proprietairesSource.tableName

  // Construire la requête
  const adresseCol = mapping.get('adresse') || 'adresse'
  const cpCol = mapping.get('codePostal') || 'code_postal'
  const sirenCol = mapping.get('siren') || 'siren'

  let query = `SELECT * FROM "${schema}"."${table}" WHERE LOWER(${adresseCol}) LIKE LOWER($1)`
  const params: any[] = [`%${address}%`]

  if (postalCode) {
    query += ` AND ${cpCol} = $2`
    params.push(postalCode)
  }

  // Exécuter la requête
  const result = await queryDataSource(proprietairesSource.id, query, params)
  const properties = result.rows.map(row => mapRowToProperty(row, mapping))

  // Enrichir avec SIRENE si disponible
  if (sireneSource) {
    return await enrichWithSirene(properties, sireneSource)
  }

  return properties
}

/**
 * Recherche par propriétaire (nom ou SIREN)
 */
export async function searchByOwner(
  owner: string,
  siren?: string
): Promise<EnrichedPropertyData[]> {
  const { proprietairesSource, sireneSource } = await getActiveSources()

  if (!proprietairesSource) {
    throw new Error('Source de données propriétaires non configurée')
  }

  const mapping = buildColumnMapping(proprietairesSource)
  const schema = proprietairesSource.schema || 'public'
  const table = proprietairesSource.tableName

  const proprietaireCol = mapping.get('proprietaire') || 'proprietaire'
  const sirenCol = mapping.get('siren') || 'siren'

  let query = `SELECT * FROM "${schema}"."${table}" WHERE `
  const params: any[] = []

  if (siren) {
    query += `${sirenCol} = $1`
    params.push(siren)
  } else {
    query += `LOWER(${proprietaireCol}) LIKE LOWER($1)`
    params.push(`%${owner}%`)
  }

  const result = await queryDataSource(proprietairesSource.id, query, params)
  const properties = result.rows.map(row => mapRowToProperty(row, mapping))

  if (sireneSource) {
    return await enrichWithSirene(properties, sireneSource)
  }

  return properties
}

/**
 * Recherche par zone géographique
 */
export async function searchByZone(
  bounds: { minLat: number; maxLat: number; minLng: number; maxLng: number }
): Promise<EnrichedPropertyData[]> {
  const { proprietairesSource, sireneSource } = await getActiveSources()

  if (!proprietairesSource) {
    throw new Error('Source de données propriétaires non configurée')
  }

  const mapping = buildColumnMapping(proprietairesSource)
  const schema = proprietairesSource.schema || 'public'
  const table = proprietairesSource.tableName

  const latCol = mapping.get('latitude') || 'latitude'
  const lngCol = mapping.get('longitude') || 'longitude'

  const query = `
    SELECT * FROM "${schema}"."${table}"
    WHERE ${latCol} BETWEEN $1 AND $2
    AND ${lngCol} BETWEEN $3 AND $4
  `

  const params = [bounds.minLat, bounds.maxLat, bounds.minLng, bounds.maxLng]

  const result = await queryDataSource(proprietairesSource.id, query, params)
  const properties = result.rows.map(row => mapRowToProperty(row, mapping))

  if (sireneSource) {
    return await enrichWithSirene(properties, sireneSource)
  }

  return properties
}

/**
 * Mappe une ligne de résultat vers PropertyData
 */
function mapRowToProperty(
  row: any,
  mapping: Map<string, string>
): PropertyData {
  const reverseMapping = new Map<string, string>()
  mapping.forEach((sourceCol, targetField) => {
    reverseMapping.set(sourceCol, targetField)
  })

  return {
    adresse: row[mapping.get('adresse') || 'adresse'],
    codePostal: row[mapping.get('codePostal') || 'code_postal'],
    ville: row[mapping.get('ville') || 'ville'],
    codeCommune: row[mapping.get('codeCommune') || 'code_commune'],
    departement: row[mapping.get('departement') || 'departement'],
    proprietaire: row[mapping.get('proprietaire') || 'proprietaire'],
    siren: row[mapping.get('siren') || 'siren'],
    latitude: row[mapping.get('latitude') || 'latitude']
      ? parseFloat(row[mapping.get('latitude') || 'latitude'])
      : undefined,
    longitude: row[mapping.get('longitude') || 'longitude']
      ? parseFloat(row[mapping.get('longitude') || 'longitude'])
      : undefined,
    section: row[mapping.get('section') || 'section'],
    numeroParcelle: row[mapping.get('numeroParcelle') || 'numero_parcelle'],
    typeLocal: row[mapping.get('typeLocal') || 'type_local'],
    surface: row[mapping.get('surface') || 'surface']
      ? parseFloat(row[mapping.get('surface') || 'surface'])
      : undefined,
  }
}

/**
 * Enrichit les propriétés avec les données SIRENE
 */
async function enrichWithSirene(
  properties: PropertyData[],
  sireneSource: any
): Promise<EnrichedPropertyData[]> {
  // Récupérer tous les SIREN uniques
  const sirens = [...new Set(
    properties
      .map(p => p.siren)
      .filter(s => s && s.length === 9)
  )]

  if (sirens.length === 0) {
    return properties
  }

  const mapping = buildColumnMapping(sireneSource)
  const schema = sireneSource.schema || 'public'
  const table = sireneSource.tableName

  const sirenCol = mapping.get('siren') || 'siren'

  // Requête SIRENE (batch)
  const placeholders = sirens.map((_, i) => `$${i + 1}`).join(',')
  const query = `SELECT * FROM "${schema}"."${table}" WHERE ${sirenCol} IN (${placeholders})`

  const result = await queryDataSource(sireneSource.id, query, sirens)

  // Créer un index SIREN -> données SIRENE
  const sireneData = new Map<string, any>()
  result.rows.forEach(row => {
    const siren = row[mapping.get('siren') || 'siren']
    sireneData.set(siren, row)
  })

  // Enrichir chaque propriété
  return properties.map(prop => {
    const enriched: EnrichedPropertyData = { ...prop }

    if (prop.siren && sireneData.has(prop.siren)) {
      const sireneRow = sireneData.get(prop.siren)

      enriched.companyName = sireneRow[mapping.get('companyName') || 'denomination'] ||
                             sireneRow[mapping.get('companyName') || 'nom_entreprise']

      enriched.dirigeantNom = sireneRow[mapping.get('dirigeantNom') || 'dirigeant_nom'] ||
                              sireneRow[mapping.get('dirigeantNom') || 'nom_dirigeant']

      enriched.dirigeantPrenom = sireneRow[mapping.get('dirigeantPrenom') || 'dirigeant_prenom'] ||
                                 sireneRow[mapping.get('dirigeantPrenom') || 'prenom_dirigeant']

      enriched.dirigeantQualite = sireneRow[mapping.get('dirigeantQualite') || 'dirigeant_qualite'] ||
                                  sireneRow[mapping.get('dirigeantQualite') || 'qualite']

      enriched.siegeAdresse = sireneRow[mapping.get('siegeAdresse') || 'siege_adresse'] ||
                              sireneRow[mapping.get('siegeAdresse') || 'adresse_siege']

      enriched.siegeCodePostal = sireneRow[mapping.get('siegeCodePostal') || 'siege_code_postal'] ||
                                 sireneRow[mapping.get('siegeCodePostal') || 'code_postal_siege']

      enriched.siegeVille = sireneRow[mapping.get('siegeVille') || 'siege_ville'] ||
                            sireneRow[mapping.get('siegeVille') || 'ville_siege']
    }

    return enriched
  })
}

/**
 * Compte les résultats sans les récupérer (pour estimation)
 */
export async function countByAddress(
  address: string,
  postalCode?: string
): Promise<number> {
  const { proprietairesSource } = await getActiveSources()

  if (!proprietairesSource) {
    throw new Error('Source de données propriétaires non configurée')
  }

  const mapping = buildColumnMapping(proprietairesSource)
  const schema = proprietairesSource.schema || 'public'
  const table = proprietairesSource.tableName

  const adresseCol = mapping.get('adresse') || 'adresse'
  const cpCol = mapping.get('codePostal') || 'code_postal'

  let query = `SELECT COUNT(*) as count FROM "${schema}"."${table}" WHERE LOWER(${adresseCol}) LIKE LOWER($1)`
  const params: any[] = [`%${address}%`]

  if (postalCode) {
    query += ` AND ${cpCol} = $2`
    params.push(postalCode)
  }

  const result = await queryDataSource(proprietairesSource.id, query, params)
  return parseInt(result.rows[0].count)
}

export async function countByOwner(owner: string, siren?: string): Promise<number> {
  const { proprietairesSource } = await getActiveSources()

  if (!proprietairesSource) {
    throw new Error('Source de données propriétaires non configurée')
  }

  const mapping = buildColumnMapping(proprietairesSource)
  const schema = proprietairesSource.schema || 'public'
  const table = proprietairesSource.tableName

  const proprietaireCol = mapping.get('proprietaire') || 'proprietaire'
  const sirenCol = mapping.get('siren') || 'siren'

  let query = `SELECT COUNT(*) as count FROM "${schema}"."${table}" WHERE `
  const params: any[] = []

  if (siren) {
    query += `${sirenCol} = $1`
    params.push(siren)
  } else {
    query += `LOWER(${proprietaireCol}) LIKE LOWER($1)`
    params.push(`%${owner}%`)
  }

  const result = await queryDataSource(proprietairesSource.id, query, params)
  return parseInt(result.rows[0].count)
}

export async function countByZone(
  bounds: { minLat: number; maxLat: number; minLng: number; maxLng: number }
): Promise<number> {
  const { proprietairesSource } = await getActiveSources()

  if (!proprietairesSource) {
    throw new Error('Source de données propriétaires non configurée')
  }

  const mapping = buildColumnMapping(proprietairesSource)
  const schema = proprietairesSource.schema || 'public'
  const table = proprietairesSource.tableName

  const latCol = mapping.get('latitude') || 'latitude'
  const lngCol = mapping.get('longitude') || 'longitude'

  const query = `
    SELECT COUNT(*) as count FROM "${schema}"."${table}"
    WHERE ${latCol} BETWEEN $1 AND $2
    AND ${lngCol} BETWEEN $3 AND $4
  `

  const params = [bounds.minLat, bounds.maxLat, bounds.minLng, bounds.maxLng]

  const result = await queryDataSource(proprietairesSource.id, query, params)
  return parseInt(result.rows[0].count)
}
