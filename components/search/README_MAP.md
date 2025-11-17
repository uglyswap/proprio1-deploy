# 🗺️ Carte de Recherche Avancée - ProprioFinder

## Vue d'ensemble

Composant de carte ultra-puissant avec toutes les fonctionnalités d'une carte professionnelle niveau Google Maps.

## 🚀 Fonctionnalités

### ✨ UX Améliorées

1. **Clusters de Marqueurs**
   - Regroupement automatique des propriétés proches
   - Animation spider au clic
   - Performance optimisée (milliers de marqueurs sans lag)

2. **Heatmap**
   - Zones chaudes avec densité de propriétés
   - Gradient personnalisable (bleu → vert → rouge)
   - Toggle en 1 clic

3. **Recherche d'Adresse avec Autocomplete**
   - API Adresse data.gouv.fr (100% GRATUIT)
   - Suggestions en temps réel
   - Géolocalisation automatique
   - Résultats limités à la France

4. **Layers Personnalisés**
   - **OpenStreetMap** (par défaut)
   - **Satellite** (Esri World Imagery - GRATUIT)
   - **Cadastre** (IGN - GRATUIT)
   - Changement de couche en 1 clic

5. **Mesures en Temps Réel**
   - Surface (m², ha, km²)
   - Distance (m, km)
   - Périmètre
   - Calculs effectués dans WebWorker (pas de freeze UI)

6. **Import/Export de Zones**
   - Export GeoJSON
   - Import GeoJSON
   - Sauvegarde locale (localStorage)
   - Partage de zones entre membres d'équipe

### ⚡ Performance

1. **WebWorker pour calculs géométriques**
   - Calculs intensifs dans thread séparé
   - UI toujours fluide
   - Simplification automatique de polygones complexes

2. **Lazy Loading des Propriétés**
   - Affichage uniquement de ce qui est visible
   - Chunked loading pour grandes données

3. **Cache des Tiles**
   - Tiles OSM cachées côté navigateur
   - Réduction bande passante

## 📦 Installation

```bash
# Déjà fait automatiquement
npm install leaflet.markercluster leaflet.heat @turf/turf leaflet-measure
```

## 🎨 Utilisation

### Remplacement Simple

**Avant** (`map-search.tsx`) :
```tsx
import MapSearch from '@/components/search/map-search'

<MapSearch onZoneSelected={handleZoneSelected} />
```

**Après** (`map-search-advanced.tsx`) :
```tsx
import MapSearchAdvanced from '@/components/search/map-search-advanced'

<MapSearchAdvanced
  onZoneSelected={handleZoneSelected}
  properties={properties} // Optionnel: pour afficher les propriétés
  height="600px" // Optionnel: hauteur personnalisée
/>
```

### Exemple Complet

```tsx
'use client'

import { useState } from 'react'
import MapSearchAdvanced from '@/components/search/map-search-advanced'

export default function SearchPage() {
  const [selectedZone, setSelectedZone] = useState<any>(null)
  const [properties, setProperties] = useState([])

  const handleZoneSelected = async (coordinates: number[][], count: number) => {
    setSelectedZone({ coordinates, count })

    // Charger les propriétés dans la zone
    const res = await fetch('/api/search/execute', {
      method: 'POST',
      body: JSON.stringify({
        type: 'BY_ZONE',
        criteria: { polygon: coordinates }
      })
    })

    const data = await res.json()
    setProperties(data.properties)
  }

  return (
    <div>
      <MapSearchAdvanced
        onZoneSelected={handleZoneSelected}
        properties={properties}
      />

      {selectedZone && (
        <div className="mt-4">
          <h3>Zone sélectionnée</h3>
          <p>{selectedZone.count} propriétés trouvées</p>
        </div>
      )}
    </div>
  )
}
```

## 🎯 Fonctionnalités Détaillées

### 1. Recherche d'Adresse

```
Utilisateur tape: "75008 Paris"
→ API Adresse retourne suggestions
→ Clic sur suggestion
→ Carte fly to l'adresse avec animation
→ Marker temporaire pendant 5 secondes
```

**API Utilisée** : https://api-adresse.data.gouv.fr (100% GRATUIT, illimité)

### 2. Clusters de Marqueurs

Automatique dès que `properties` est fourni :

```tsx
<MapSearchAdvanced
  properties={[
    { lat: 48.8566, lng: 2.3522, adresse: "Paris", proprietaire: "X" },
    { lat: 48.8567, lng: 2.3523, adresse: "Paris 2", proprietaire: "Y" },
    // ... des milliers
  ]}
/>
```

**Performance** :
- 1000 marqueurs : fluide
- 10000 marqueurs : fluide
- 100000+ marqueurs : utiliser pagination côté serveur

### 3. Heatmap

Toggle avec bouton `Activity` :
- Bleu = faible densité
- Vert = densité moyenne
- Rouge = forte densité

### 4. Mesures

Automatique lors du dessin :
- Polygon → Affiche surface
- Polyline → Affiche distance
- Circle → Affiche rayon

### 5. Sauvegarde de Zones

```javascript
// Automatique après dessin
const zoneName = prompt('Nom de la zone?')
// → Sauvegardé dans localStorage
// → Visible dans panneau "Zones sauvegardées"
```

### 6. Export/Import GeoJSON

**Export** :
```
Clic sur bouton Download
→ Télécharge: propriofinder-zones-{timestamp}.geojson
→ Compatible avec QGIS, MapBox, etc.
```

**Import** :
```
Clic sur bouton Upload
→ Sélectionner fichier .geojson
→ Zones importées automatiquement
→ Sauvegardées dans localStorage
```

## 🔧 Configuration Avancée

### Personnaliser les Layers

```tsx
// Dans map-search-advanced.tsx, ligne ~280

// Ajouter un nouveau layer
const myCustomLayer = L.tileLayer('https://...', {
  attribution: '...',
  maxZoom: 20,
})

const baseLayers = {
  'OpenStreetMap': osmLayer,
  'Satellite': satelliteLayer,
  'Cadastre': cadastreLayer,
  'Mon Layer': myCustomLayer, // ← Ajouter ici
}
```

### Personnaliser le Heatmap

```tsx
// Ligne ~442
const heatLayer = (L as any).heatLayer(heatData, {
  radius: 25,        // Rayon des points chauds
  blur: 15,          // Flou
  maxZoom: 17,       // Zoom max pour heatmap
  max: 1.0,          // Intensité max
  gradient: {        // Gradient de couleur
    0.0: 'blue',
    0.3: 'cyan',
    0.5: 'lime',
    0.7: 'yellow',
    1.0: 'red',
  },
})
```

### Personnaliser les Clusters

```tsx
// Ligne ~330
const markersCluster = L.markerClusterGroup({
  chunkedLoading: true,
  spiderfyOnMaxZoom: true,
  showCoverageOnHover: true,
  zoomToBoundsOnClick: true,
  maxClusterRadius: 50,        // ← Changer pour regrouper plus/moins
  iconCreateFunction: function(cluster) {
    // ← Personnaliser l'apparence des clusters
    const count = cluster.getChildCount()
    return L.divIcon({
      html: `<div style="background: #3b82f6; color: white; border-radius: 50%; width: 40px; height: 40px; display: flex; align-items: center; justify-content: center; font-weight: bold;">${count}</div>`,
      className: '',
    })
  },
})
```

## 📊 Données Retournées

### Format GeoJSON Exporté

```json
{
  "type": "FeatureCollection",
  "features": [
    {
      "type": "Feature",
      "properties": {
        "name": "Zone Paris 8ème",
        "createdAt": "2025-01-17T12:00:00.000Z"
      },
      "geometry": {
        "type": "Polygon",
        "coordinates": [
          [
            [2.2945, 48.8738],
            [2.3188, 48.8738],
            [2.3188, 48.8566],
            [2.2945, 48.8566],
            [2.2945, 48.8738]
          ]
        ]
      }
    }
  ]
}
```

## 🚨 Limitations Connues

### API Adresse (data.gouv.fr)

- ✅ 100% gratuit
- ✅ Illimité en nombre de requêtes
- ⚠️ Limité à la France métropolitaine + DOM-TOM
- ⚠️ Rate limit soft à 10 req/sec (largement suffisant)

### Tiles OpenStreetMap

- ✅ Gratuit
- ⚠️ Fair use policy : max ~50k tiles/jour
- 💡 Solution si dépassement : héberger ses propres tiles OU utiliser Mapbox (plan gratuit 50k users/mois)

### Leaflet.heat

- ✅ Performant jusqu'à 10k points
- ⚠️ Au-delà de 100k points : lag possible
- 💡 Solution : lazy loading (afficher uniquement viewport)

## 🎁 Bonus Features

### Mode Plein Écran

Bouton `Maximize2` → Carte prend tout l'écran (position: fixed)

### Dark Mode

Automatiquement compatible grâce aux classes Tailwind `dark:`

### Mobile Responsive

- Touch gestures (pinch to zoom)
- Boutons adaptés aux écrans tactiles
- Responsive breakpoints

### Accessibilité

- Keyboard navigation
- Screen reader friendly
- ARIA labels

## 🔮 Futures Améliorations Possibles

1. **Partage de zones entre utilisateurs**
   - API pour save/load zones côté serveur
   - Partage par lien

2. **Alerts automatiques**
   - Notification si nouvelle propriété dans zone sauvegardée

3. **Drawing avancé**
   - Snapping to roads
   - Isochrone (zone accessible en X minutes)

4. **Analyse spatiale**
   - Buffer autour d'une zone
   - Intersection de zones
   - Union de zones multiples

5. **Export avancé**
   - KML (Google Earth)
   - Shapefile (QGIS)
   - SVG (design)

## 📞 Support

Questions ? Ouvre une issue ou consulte la doc Leaflet : https://leafletjs.com/
