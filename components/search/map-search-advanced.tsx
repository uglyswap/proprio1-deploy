'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import 'leaflet-draw'
import 'leaflet-draw/dist/leaflet.draw.css'
import 'leaflet.markercluster/dist/MarkerCluster.css'
import 'leaflet.markercluster/dist/MarkerCluster.Default.css'
import 'leaflet.markercluster'
import 'leaflet.heat'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Search,
  Layers,
  Download,
  Upload,
  Ruler,
  MapPin,
  Maximize2,
  Minimize2,
  Activity,
} from 'lucide-react'

// Fix Leaflet default icon issue with Next.js
delete (L.Icon.Default.prototype as any)._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
})

interface MapSearchAdvancedProps {
  onZoneSelected: (polygon: number[][], estimatedCount: number) => void
  properties?: Array<{ lat: number; lng: number; [key: string]: any }>
  height?: string
}

type LayerType = 'osm' | 'satellite' | 'cadastre' | 'heatmap'
type ViewMode = 'normal' | 'fullscreen'

export default function MapSearchAdvanced({
  onZoneSelected,
  properties = [],
  height = '600px',
}: MapSearchAdvancedProps) {
  const mapRef = useRef<L.Map | null>(null)
  const drawnItemsRef = useRef<L.FeatureGroup | null>(null)
  const markersClusterRef = useRef<L.MarkerClusterGroup | null>(null)
  const heatLayerRef = useRef<L.HeatLayer | null>(null)
  const geoWorkerRef = useRef<Worker | null>(null)

  const [isLoading, setIsLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [addressSuggestions, setAddressSuggestions] = useState<any[]>([])
  const [activeLayer, setActiveLayer] = useState<LayerType>('osm')
  const [showHeatmap, setShowHeatmap] = useState(false)
  const [showClusters, setShowClusters] = useState(true)
  const [viewMode, setViewMode] = useState<ViewMode>('normal')
  const [measurements, setMeasurements] = useState<{
    area?: string
    distance?: string
  }>({})
  const [savedZones, setSavedZones] = useState<any[]>([])

  // Initialize WebWorker
  useEffect(() => {
    if (typeof window !== 'undefined' && !geoWorkerRef.current) {
      try {
        geoWorkerRef.current = new Worker('/workers/geo-worker.js')

        geoWorkerRef.current.onmessage = (e) => {
          const { type, result } = e.data

          switch (type) {
            case 'areaCalculated':
              setMeasurements(prev => ({
                ...prev,
                area: `${result.ha} ha (${result.km2} km²)`,
              }))
              break
            case 'distanceCalculated':
              setMeasurements(prev => ({
                ...prev,
                distance: `${result.km} km (${result.m} m)`,
              }))
              break
          }
        }
      } catch (error) {
        console.warn('WebWorker not available, using main thread')
      }
    }

    return () => {
      if (geoWorkerRef.current) {
        geoWorkerRef.current.terminate()
        geoWorkerRef.current = null
      }
    }
  }, [])

  // Autocomplete adresse avec API Adresse (data.gouv.fr - GRATUIT)
  const searchAddress = useCallback(async (query: string) => {
    if (query.length < 3) {
      setAddressSuggestions([])
      return
    }

    try {
      const res = await fetch(
        `https://api-adresse.data.gouv.fr/search/?q=${encodeURIComponent(query)}&limit=5`
      )
      const data = await res.json()
      setAddressSuggestions(data.features || [])
    } catch (error) {
      console.error('Address search failed:', error)
    }
  }, [])

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery) {
        searchAddress(searchQuery)
      }
    }, 300)

    return () => clearTimeout(timer)
  }, [searchQuery, searchAddress])

  // Fly to address
  const goToAddress = (feature: any) => {
    if (!mapRef.current) return

    const [lng, lat] = feature.geometry.coordinates
    mapRef.current.flyTo([lat, lng], 16, {
      duration: 1.5,
    })

    // Add temporary marker
    const marker = L.marker([lat, lng])
      .addTo(mapRef.current)
      .bindPopup(feature.properties.label)
      .openPopup()

    setTimeout(() => marker.remove(), 5000)
    setAddressSuggestions([])
    setSearchQuery('')
  }

  // Load saved zones from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('savedMapZones')
    if (saved) {
      try {
        setSavedZones(JSON.parse(saved))
      } catch (error) {
        console.error('Failed to load saved zones')
      }
    }
  }, [])

  // Save zone
  const saveZone = (coordinates: number[][], name: string) => {
    const newZone = {
      id: Date.now(),
      name,
      coordinates,
      createdAt: new Date().toISOString(),
    }

    const updated = [...savedZones, newZone]
    setSavedZones(updated)
    localStorage.setItem('savedMapZones', JSON.stringify(updated))
  }

  // Load zone
  const loadZone = (zone: any) => {
    if (!mapRef.current || !drawnItemsRef.current) return

    drawnItemsRef.current.clearLayers()

    const polygon = L.polygon(
      zone.coordinates.map((coord: number[]) => [coord[1], coord[0]])
    )
    drawnItemsRef.current.addLayer(polygon)

    mapRef.current.fitBounds(polygon.getBounds())
  }

  // Export zones as GeoJSON
  const exportZones = () => {
    const geojson = {
      type: 'FeatureCollection',
      features: savedZones.map(zone => ({
        type: 'Feature',
        properties: {
          name: zone.name,
          createdAt: zone.createdAt,
        },
        geometry: {
          type: 'Polygon',
          coordinates: [zone.coordinates],
        },
      })),
    }

    const blob = new Blob([JSON.stringify(geojson, null, 2)], {
      type: 'application/json',
    })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `propriofinder-zones-${Date.now()}.geojson`
    a.click()
    URL.revokeObjectURL(url)
  }

  // Import zones from GeoJSON
  const importZones = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (event) => {
      try {
        const geojson = JSON.parse(event.target?.result as string)
        const imported = geojson.features.map((feature: any, index: number) => ({
          id: Date.now() + index,
          name: feature.properties.name || `Zone importée ${index + 1}`,
          coordinates: feature.geometry.coordinates[0],
          createdAt: feature.properties.createdAt || new Date().toISOString(),
        }))

        const updated = [...savedZones, ...imported]
        setSavedZones(updated)
        localStorage.setItem('savedMapZones', JSON.stringify(updated))
      } catch (error) {
        console.error('Failed to import zones:', error)
        alert('Fichier GeoJSON invalide')
      }
    }
    reader.readAsText(file)
  }

  // Toggle fullscreen
  const toggleFullscreen = () => {
    setViewMode(prev => prev === 'normal' ? 'fullscreen' : 'normal')
  }

  // Initialize map
  useEffect(() => {
    if (mapRef.current) return

    const map = L.map('map-advanced', {
      center: [46.603354, 1.888334],
      zoom: 6,
      zoomControl: true,
    })

    // OSM Layer (default)
    const osmLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
      maxZoom: 19,
    }).addTo(map)

    // Satellite Layer
    const satelliteLayer = L.tileLayer(
      'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
      {
        attribution: '&copy; Esri',
        maxZoom: 18,
      }
    )

    // Cadastre Layer (IGN - GRATUIT)
    const cadastreLayer = L.tileLayer(
      'https://wxs.ign.fr/parcellaire/geoportail/wmts?SERVICE=WMTS&REQUEST=GetTile&VERSION=1.0.0&LAYER=CADASTRALPARCELS.PARCELLAIRE_EXPRESS&STYLE=normal&FORMAT=image/png&TILEMATRIXSET=PM&TILEMATRIX={z}&TILEROW={y}&TILECOL={x}',
      {
        attribution: '&copy; IGN',
        maxZoom: 20,
      }
    )

    // Layer control
    const baseLayers = {
      'OpenStreetMap': osmLayer,
      'Satellite': satelliteLayer,
      'Cadastre': cadastreLayer,
    }
    L.control.layers(baseLayers).addTo(map)

    // Marker Cluster Group
    const markersCluster = L.markerClusterGroup({
      chunkedLoading: true,
      spiderfyOnMaxZoom: true,
      showCoverageOnHover: true,
      zoomToBoundsOnClick: true,
      maxClusterRadius: 50,
    })
    markersClusterRef.current = markersCluster

    // Draw control
    const drawnItems = new L.FeatureGroup()
    map.addLayer(drawnItems)
    drawnItemsRef.current = drawnItems

    const drawControl = new L.Control.Draw({
      position: 'topright',
      draw: {
        polygon: {
          allowIntersection: false,
          showArea: true,
          metric: true as any, // Use metric units (types are incorrect in @types/leaflet-draw)
          shapeOptions: {
            color: '#3b82f6',
            weight: 3,
            fillOpacity: 0.2,
          },
        },
        rectangle: {
          showArea: true,
          metric: true as any,
          shapeOptions: {
            color: '#3b82f6',
            weight: 3,
            fillOpacity: 0.2,
          },
        },
        circle: {
          shapeOptions: {
            color: '#8b5cf6',
            weight: 3,
            fillOpacity: 0.2,
          },
          metric: true as any,
        },
        circlemarker: false,
        marker: true,
        polyline: {
          shapeOptions: {
            color: '#ef4444',
            weight: 3,
          },
          metric: true as any,
        },
      },
      edit: {
        featureGroup: drawnItems,
        remove: true,
        edit: true,
      },
    })
    map.addControl(drawControl)

    // Scale control
    L.control.scale({ imperial: false, metric: true }).addTo(map)

    // Handle drawing created
    map.on(L.Draw.Event.CREATED, async function (e: any) {
      const layer = e.layer

      drawnItems.clearLayers()
      drawnItems.addLayer(layer)

      let coordinates: number[][]

      if (e.layerType === 'rectangle') {
        const bounds = layer.getBounds()
        coordinates = [
          [bounds.getSouthWest().lng, bounds.getSouthWest().lat],
          [bounds.getNorthWest().lng, bounds.getNorthWest().lat],
          [bounds.getNorthEast().lng, bounds.getNorthEast().lat],
          [bounds.getSouthEast().lng, bounds.getSouthEast().lat],
          [bounds.getSouthWest().lng, bounds.getSouthWest().lat],
        ]
      } else if (e.layerType === 'circle') {
        const center = layer.getLatLng()
        const radius = layer.getRadius()
        const numPoints = 64
        coordinates = []

        for (let i = 0; i <= numPoints; i++) {
          const angle = (i / numPoints) * 2 * Math.PI
          const lat = center.lat + (radius / 111320) * Math.cos(angle)
          const lng = center.lng + (radius / (111320 * Math.cos(center.lat * Math.PI / 180))) * Math.sin(angle)
          coordinates.push([lng, lat])
        }
      } else if (e.layerType === 'polygon') {
        coordinates = layer.getLatLngs()[0].map((latlng: L.LatLng) => [
          latlng.lng,
          latlng.lat,
        ])
        coordinates.push(coordinates[0])
      } else {
        return
      }

      // Calculate area with WebWorker
      if (geoWorkerRef.current) {
        geoWorkerRef.current.postMessage({
          type: 'calculateArea',
          data: { coordinates },
        })
      }

      setIsLoading(true)

      try {
        const res = await fetch('/api/search/estimate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'BY_ZONE',
            criteria: { polygon: coordinates },
          }),
        })

        const data = await res.json()

        if (res.ok) {
          onZoneSelected(coordinates, data.estimatedRows)

          // Prompt to save zone
          const zoneName = prompt('Voulez-vous sauvegarder cette zone? (Nom optionnel)')
          if (zoneName !== null) {
            saveZone(coordinates, zoneName || `Zone ${Date.now()}`)
          }
        }
      } catch (error) {
        console.error('Estimation error:', error)
      } finally {
        setIsLoading(false)
      }
    })

    mapRef.current = map

    return () => {
      map.remove()
      mapRef.current = null
    }
  }, [onZoneSelected])

  // Update properties on map (clusters + heatmap)
  useEffect(() => {
    if (!mapRef.current || !markersClusterRef.current) return

    markersClusterRef.current.clearLayers()

    if (showClusters && properties.length > 0) {
      // Add markers with clustering
      properties.forEach((prop) => {
        const marker = L.marker([prop.lat, prop.lng])
        if (prop.adresse) {
          marker.bindPopup(`
            <div class="p-2">
              <strong>${prop.adresse}</strong>
              ${prop.proprietaire ? `<br/>Propriétaire: ${prop.proprietaire}` : ''}
              ${prop.surface ? `<br/>Surface: ${prop.surface} m²` : ''}
            </div>
          `)
        }
        markersClusterRef.current?.addLayer(marker)
      })

      mapRef.current.addLayer(markersClusterRef.current)
    }

    // Heatmap
    if (showHeatmap && properties.length > 0) {
      if (heatLayerRef.current) {
        mapRef.current.removeLayer(heatLayerRef.current)
      }

      const heatData = properties.map(prop => [prop.lat, prop.lng, 1])

      const heatLayer = (L as any).heatLayer(heatData, {
        radius: 25,
        blur: 15,
        maxZoom: 17,
        max: 1.0,
        gradient: {
          0.0: 'blue',
          0.5: 'lime',
          1.0: 'red',
        },
      })

      heatLayer.addTo(mapRef.current)
      heatLayerRef.current = heatLayer
    } else if (heatLayerRef.current && mapRef.current) {
      mapRef.current.removeLayer(heatLayerRef.current)
      heatLayerRef.current = null
    }
  }, [properties, showClusters, showHeatmap])

  return (
    <div
      className={`relative ${
        viewMode === 'fullscreen'
          ? 'fixed inset-0 z-50 bg-white dark:bg-gray-900'
          : ''
      }`}
    >
      {/* Search Bar */}
      <Card className="absolute top-4 left-4 right-4 z-[1000] p-4">
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Rechercher une adresse..."
              className="pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />

            {addressSuggestions.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                {addressSuggestions.map((suggestion, index) => (
                  <button
                    key={index}
                    className="w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 flex items-start gap-2"
                    onClick={() => goToAddress(suggestion)}
                  >
                    <MapPin className="h-4 w-4 mt-0.5 shrink-0 text-blue-600" />
                    <div>
                      <div className="font-medium text-sm">
                        {suggestion.properties.name}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {suggestion.properties.context}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowClusters(!showClusters)}
            className={showClusters ? 'bg-blue-50 dark:bg-blue-900' : ''}
          >
            <MapPin className="h-4 w-4" />
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowHeatmap(!showHeatmap)}
            className={showHeatmap ? 'bg-red-50 dark:bg-red-900' : ''}
          >
            <Activity className="h-4 w-4" />
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={exportZones}
            disabled={savedZones.length === 0}
          >
            <Download className="h-4 w-4" />
          </Button>

          <label>
            <input
              type="file"
              accept=".geojson,.json"
              className="hidden"
              onChange={importZones}
            />
            <Button variant="outline" size="sm" as="span">
              <Upload className="h-4 w-4" />
            </Button>
          </label>

          <Button variant="outline" size="sm" onClick={toggleFullscreen}>
            {viewMode === 'fullscreen' ? (
              <Minimize2 className="h-4 w-4" />
            ) : (
              <Maximize2 className="h-4 w-4" />
            )}
          </Button>
        </div>
      </Card>

      {/* Measurements Panel */}
      {(measurements.area || measurements.distance) && (
        <Card className="absolute top-20 right-4 z-[1000] p-3 min-w-[200px]">
          <div className="text-sm font-medium mb-2 flex items-center gap-2">
            <Ruler className="h-4 w-4" />
            Mesures
          </div>
          {measurements.area && (
            <div className="text-sm">
              <span className="text-gray-600 dark:text-gray-400">Surface:</span>{' '}
              <span className="font-semibold">{measurements.area}</span>
            </div>
          )}
          {measurements.distance && (
            <div className="text-sm mt-1">
              <span className="text-gray-600 dark:text-gray-400">Distance:</span>{' '}
              <span className="font-semibold">{measurements.distance}</span>
            </div>
          )}
        </Card>
      )}

      {/* Saved Zones */}
      {savedZones.length > 0 && (
        <Card className="absolute bottom-4 left-4 z-[1000] p-3 max-w-xs max-h-60 overflow-y-auto">
          <div className="text-sm font-medium mb-2">Zones sauvegardées</div>
          <div className="space-y-1">
            {savedZones.map((zone) => (
              <button
                key={zone.id}
                className="w-full text-left px-2 py-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 text-sm"
                onClick={() => loadZone(zone)}
              >
                <div className="font-medium">{zone.name}</div>
                <div className="text-xs text-gray-500">
                  {new Date(zone.createdAt).toLocaleDateString('fr-FR')}
                </div>
              </button>
            ))}
          </div>
        </Card>
      )}

      {/* Map */}
      <div
        id="map-advanced"
        style={{ height: viewMode === 'fullscreen' ? '100vh' : height }}
        className="rounded-lg border"
      />

      {/* Loading Overlay */}
      {isLoading && (
        <div className="absolute inset-0 bg-black/20 rounded-lg flex items-center justify-center z-[1001]">
          <Card className="p-4 flex items-center gap-2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary" />
            <span>Calcul en cours...</span>
          </Card>
        </div>
      )}
    </div>
  )
}
