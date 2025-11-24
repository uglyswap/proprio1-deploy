'use client'

import { useEffect, useRef, useState } from 'react'
import L from 'leaflet'
import 'leaflet-draw'

// Fix Leaflet default icon issue with Next.js
delete (L.Icon.Default.prototype as any)._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
})

interface MapSearchProps {
  onZoneSelected: (polygon: number[][], estimatedCount: number) => void
}

export default function MapSearch({ onZoneSelected }: MapSearchProps) {
  const mapRef = useRef<L.Map | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (mapRef.current) return // Map already initialized

    // Initialize map
    const map = L.map('map', {
      center: [46.603354, 1.888334], // Center of France
      zoom: 6,
    })

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(map)

    // Add draw control
    const drawnItems = new L.FeatureGroup()
    map.addLayer(drawnItems)

    const drawControl = new L.Control.Draw({
      position: 'topright',
      draw: {
        polygon: {
          allowIntersection: false,
          showArea: true,
          shapeOptions: {
            color: '#3b82f6',
            weight: 2,
            fillOpacity: 0.2,
          },
        },
        rectangle: {
          shapeOptions: {
            color: '#3b82f6',
            weight: 2,
            fillOpacity: 0.2,
          },
        },
        circle: false,
        circlemarker: false,
        marker: false,
        polyline: false,
      },
      edit: {
        featureGroup: drawnItems,
        remove: true,
      },
    })
    map.addControl(drawControl)

    // Handle drawing created
    map.on(L.Draw.Event.CREATED, async function (e: any) {
      const layer = e.layer

      // Clear previous drawings
      drawnItems.clearLayers()
      drawnItems.addLayer(layer)

      // Get coordinates
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
      } else {
        // Polygon
        coordinates = layer.getLatLngs()[0].map((latlng: L.LatLng) => [
          latlng.lng,
          latlng.lat,
        ])
        coordinates.push(coordinates[0]) // Close polygon
      }

      setIsLoading(true)

      try {
        // Call API to estimate count
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

  return (
    <div className="relative">
      <div id="map" className="h-96 rounded-lg border" />
      {isLoading && (
        <div className="absolute inset-0 bg-black/20 rounded-lg flex items-center justify-center">
          <div className="bg-white p-4 rounded-lg shadow-lg flex items-center gap-2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary" />
            <span>Calcul en cours...</span>
          </div>
        </div>
      )}
    </div>
  )
}
