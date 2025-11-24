/**
 * Service de recherche en cascade des dirigeants
 * Trouve le dirigeant personne physique ultime en remontant la chaine des personnes morales
 * Utilise l'API Recherche d'entreprises (https://recherche-entreprises.api.gouv.fr)
 */

// Types pour l'API Recherche d'entreprises
interface Dirigeant {
  nom?: string;
  prenoms?: string;
  date_de_naissance?: string;
  nationalite?: string;
  qualite?: string;
  type_dirigeant: 'personne physique' | 'personne morale';

  // Pour personne morale
  siren?: string;
  denomination?: string;
}

interface Entreprise {
  siren: string;
  nom_complet: string;
  nom_raison_sociale?: string;
  sigle?: string;
  nombre_etablissements: number;
  categorie_entreprise?: string;
  etat_administratif: string;
  dirigeants: Dirigeant[];
  siege: {
    siret: string;
    adresse: string;
    code_postal: string;
    libelle_commune: string;
    latitude?: number;
    longitude?: number;
  };
}

interface SearchResult {
  results: Entreprise[];
  total_results: number;
  page: number;
  per_page: number;
}

// Type pour le resultat de la recherche en cascade
export interface UltimateDirigeant {
  nom: string;
  prenom: string;
  qualite: string;
  dateNaissance?: string;
  nationalite?: string;

  // Chaine des entreprises traversees
  chaineSiren: string[];
  chaineNoms: string[];
  profondeur: number;
}

export interface CascadeSearchResult {
  sirenOriginal: string;
  entrepriseOriginale: string;
  dirigeantsUltimes: UltimateDirigeant[];
  erreurs: string[];
  tempsRecherche: number;
}

const API_BASE = 'https://recherche-entreprises.api.gouv.fr';
const MAX_DEPTH = 10; // Limite de profondeur pour eviter les boucles infinies
const REQUEST_DELAY = 100; // Delai entre requetes pour respecter les limites API

/**
 * Recherche une entreprise par SIREN via l'API
 */
async function searchBySiren(siren: string): Promise<Entreprise | null> {
  try {
    const response = await fetch(
      `${API_BASE}/search?q=${siren}&mtm_campaign=proprio-finder`
    );

    if (!response.ok) {
      console.error(`API error for SIREN ${siren}: ${response.status}`);
      return null;
    }

    const data: SearchResult = await response.json();

    // Trouver l'entreprise avec le SIREN exact
    const entreprise = data.results.find(e => e.siren === siren);
    return entreprise || null;

  } catch (error) {
    console.error(`Error fetching SIREN ${siren}:`, error);
    return null;
  }
}

/**
 * Delai pour respecter les limites de l'API
 */
function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Recherche recursive des dirigeants personnes physiques
 */
async function findPersonnesPhysiques(
  siren: string,
  chaineSiren: string[],
  chaineNoms: string[],
  depth: number,
  visitedSirens: Set<string>
): Promise<UltimateDirigeant[]> {
  // Verifications de securite
  if (depth > MAX_DEPTH) {
    console.warn(`Max depth reached for SIREN ${siren}`);
    return [];
  }

  if (visitedSirens.has(siren)) {
    console.warn(`Circular reference detected for SIREN ${siren}`);
    return [];
  }

  visitedSirens.add(siren);

  // Rechercher l'entreprise
  await delay(REQUEST_DELAY);
  const entreprise = await searchBySiren(siren);

  if (!entreprise) {
    return [];
  }

  const nouveauChaineSiren = [...chaineSiren, siren];
  const nouveauChaineNoms = [...chaineNoms, entreprise.nom_complet];

  const resultats: UltimateDirigeant[] = [];

  // Parcourir les dirigeants
  for (const dirigeant of entreprise.dirigeants) {
    if (dirigeant.type_dirigeant === 'personne physique') {
      // Trouve! Ajouter au resultat
      resultats.push({
        nom: dirigeant.nom || '',
        prenom: dirigeant.prenoms || '',
        qualite: dirigeant.qualite || '',
        dateNaissance: dirigeant.date_de_naissance,
        nationalite: dirigeant.nationalite,
        chaineSiren: nouveauChaineSiren,
        chaineNoms: nouveauChaineNoms,
        profondeur: depth,
      });
    } else if (dirigeant.type_dirigeant === 'personne morale' && dirigeant.siren) {
      // C'est une entreprise - recherche recursive
      const sousDirigeants = await findPersonnesPhysiques(
        dirigeant.siren,
        nouveauChaineSiren,
        nouveauChaineNoms,
        depth + 1,
        visitedSirens
      );
      resultats.push(...sousDirigeants);
    }
  }

  return resultats;
}

/**
 * Fonction principale: trouve tous les dirigeants personnes physiques ultimes
 * a partir d'un numero SIREN
 */
export async function findUltimateDirigeants(siren: string): Promise<CascadeSearchResult> {
  const startTime = Date.now();
  const erreurs: string[] = [];

  // Valider le SIREN
  if (!siren || siren.length !== 9 || !/^\d{9}$/.test(siren)) {
    return {
      sirenOriginal: siren,
      entrepriseOriginale: '',
      dirigeantsUltimes: [],
      erreurs: ['SIREN invalide - doit etre 9 chiffres'],
      tempsRecherche: Date.now() - startTime,
    };
  }

  // Rechercher l'entreprise originale
  const entreprise = await searchBySiren(siren);

  if (!entreprise) {
    return {
      sirenOriginal: siren,
      entrepriseOriginale: '',
      dirigeantsUltimes: [],
      erreurs: ['Entreprise non trouvee pour ce SIREN'],
      tempsRecherche: Date.now() - startTime,
    };
  }

  // Lancer la recherche recursive
  const visitedSirens = new Set<string>();
  const dirigeantsUltimes = await findPersonnesPhysiques(
    siren,
    [],
    [],
    0,
    visitedSirens
  );

  // Si aucun dirigeant trouve
  if (dirigeantsUltimes.length === 0) {
    erreurs.push('Aucun dirigeant personne physique trouve');

    // Ajouter les dirigeants directs meme si ce sont des personnes morales
    for (const d of entreprise.dirigeants) {
      if (d.type_dirigeant === 'personne morale') {
        erreurs.push(`Dirigeant personne morale: ${d.denomination || d.siren}`);
      }
    }
  }

  return {
    sirenOriginal: siren,
    entrepriseOriginale: entreprise.nom_complet,
    dirigeantsUltimes,
    erreurs,
    tempsRecherche: Date.now() - startTime,
  };
}

/**
 * Recherche en batch pour plusieurs SIREN
 */
export async function findUltimateDirigeantsBatch(
  sirens: string[]
): Promise<Map<string, CascadeSearchResult>> {
  const results = new Map<string, CascadeSearchResult>();

  for (const siren of sirens) {
    const result = await findUltimateDirigeants(siren);
    results.set(siren, result);
  }

  return results;
}
