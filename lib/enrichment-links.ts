interface PropertyLinks {
  googleMaps: string
  streetView: string
  pappers: string | null
  cadastre: string
  dvf: string
  geoportail: string
  infogreffe: string | null
}

interface PropertyData {
  adresse: string
  codePostal: string
  ville: string
  codeCommune: string
  latitude: number
  longitude: number
  siren?: string
  section?: string
  numeroParcelle?: string
}

/**
 * Generate enrichment links for a property
 * All links are free and point to official sources
 */
export function generateEnrichmentLinks(property: PropertyData): PropertyLinks {
  const {
    adresse,
    codePostal,
    ville,
    codeCommune,
    latitude,
    longitude,
    siren,
    section,
    numeroParcelle
  } = property

  return {
    // Google Maps (exact position)
    googleMaps: `https://www.google.com/maps?q=${latitude},${longitude}`,

    // Street View
    streetView: `https://www.google.com/maps/@?api=1&map_action=pano&viewpoint=${latitude},${longitude}`,

    // Pappers (if SIREN available)
    pappers: siren
      ? `https://www.pappers.fr/entreprise/${siren}`
      : null,

    // Cadastre
    cadastre: section && numeroParcelle
      ? `https://www.cadastre.gouv.fr/scpc/rechercherPlan.do?codeCommune=${codeCommune}&section=${section}&numeroParcelle=${numeroParcelle}`
      : `https://www.cadastre.gouv.fr/scpc/accueil.do?query=${encodeURIComponent(`${adresse} ${codePostal}`)}`,

    // DVF (property transactions)
    dvf: `https://app.dvf.etalab.gouv.fr/?code_commune=${codeCommune}&nom_voie=${encodeURIComponent(
      adresse.split(' ').slice(1).join(' ')
    )}`,

    // Géoportail (aerial view + cadastre overlay)
    geoportail: `https://www.geoportail.gouv.fr/carte?c=${longitude},${latitude}&z=18&l0=ORTHOIMAGERY.ORTHOPHOTOS::GEOPORTAIL:OGC:WMTS(1)&l1=CADASTRALPARCELS.PARCELLAIRE_EXPRESS::GEOPORTAIL:OGC:WMTS(1)&permalink=yes`,

    // Infogreffe (alternative company lookup)
    infogreffe: siren
      ? `https://www.infogreffe.fr/entreprise/${siren}`
      : null
  }
}
