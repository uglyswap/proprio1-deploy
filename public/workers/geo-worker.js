// WebWorker pour calculs géométriques intensifs
// Évite de bloquer le thread principal

import * as turf from '@turf/turf'

self.onmessage = function(e) {
  const { type, data } = e.data

  switch (type) {
    case 'calculateArea':
      try {
        const polygon = turf.polygon([data.coordinates])
        const area = turf.area(polygon) // en m²
        const areaKm2 = area / 1000000
        const areaHa = area / 10000

        self.postMessage({
          type: 'areaCalculated',
          result: {
            m2: Math.round(area),
            km2: areaKm2.toFixed(2),
            ha: areaHa.toFixed(2),
          }
        })
      } catch (error) {
        self.postMessage({
          type: 'error',
          error: 'Failed to calculate area'
        })
      }
      break

    case 'calculateDistance':
      try {
        const from = turf.point(data.from)
        const to = turf.point(data.to)
        const distance = turf.distance(from, to, { units: 'kilometers' })

        self.postMessage({
          type: 'distanceCalculated',
          result: {
            km: distance.toFixed(2),
            m: (distance * 1000).toFixed(0)
          }
        })
      } catch (error) {
        self.postMessage({
          type: 'error',
          error: 'Failed to calculate distance'
        })
      }
      break

    case 'simplifyPolygon':
      try {
        const polygon = turf.polygon([data.coordinates])
        const simplified = turf.simplify(polygon, {
          tolerance: data.tolerance || 0.001,
          highQuality: true
        })

        self.postMessage({
          type: 'polygonSimplified',
          result: simplified.geometry.coordinates[0]
        })
      } catch (error) {
        self.postMessage({
          type: 'error',
          error: 'Failed to simplify polygon'
        })
      }
      break

    case 'pointsInPolygon':
      try {
        const polygon = turf.polygon([data.polygon])
        const pointsWithin = data.points.filter((point: number[]) => {
          const pt = turf.point(point)
          return turf.booleanPointInPolygon(pt, polygon)
        })

        self.postMessage({
          type: 'pointsFiltered',
          result: pointsWithin
        })
      } catch (error) {
        self.postMessage({
          type: 'error',
          error: 'Failed to filter points'
        })
      }
      break

    default:
      self.postMessage({
        type: 'error',
        error: `Unknown type: ${type}`
      })
  }
}
