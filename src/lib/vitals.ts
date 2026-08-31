import { onLCP, onCLS, onFCP, onINP, onTTFB } from 'web-vitals'

function report(metric: { name: string; value: number; unit?: string; rating: string }): void {
  if (import.meta.env.DEV) {
    const colors = {
      good: '#0cce6b',
      needsImprovement: '#ffa400',
      poor: '#ff4e42'
    }
    const color = (colors as Record<string, string>)[metric.rating] || '#999'
    console.log(
      `%c${metric.name}%c ${metric.value.toFixed(1)}${metric.unit === 'ms' ? 'ms' : ''} (${metric.rating})`,
      `color: ${color}; font-weight: bold`,
      'color: inherit'
    )
  }
}

export function reportWebVitals() {
  onLCP(report)
  onCLS(report)
  onFCP(report)
  onINP(report)
  onTTFB(report)
}
