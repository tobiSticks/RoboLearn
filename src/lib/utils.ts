import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getDifficultyColor(difficulty: string) {
  switch (difficulty) {
    case 'beginner':     return 'bg-green-100 text-green-800'
    case 'intermediate': return 'bg-amber-100 text-amber-800'
    case 'advanced':     return 'bg-red-100 text-red-800'
    default:             return 'bg-gray-100 text-gray-800'
  }
}

export function getTrackColor(slug: string) {
  switch (slug) {
    case 'software':   return { bg: 'bg-blue-50',   text: 'text-blue-800',   border: 'border-blue-200',   hex: '#378ADD' }
    case 'mechanical': return { bg: 'bg-orange-50', text: 'text-orange-800', border: 'border-orange-200', hex: '#D85A30' }
    case 'electrical': return { bg: 'bg-green-50',  text: 'text-green-800',  border: 'border-green-200',  hex: '#1D9E75' }
    default:           return { bg: 'bg-gray-50',   text: 'text-gray-800',   border: 'border-gray-200',   hex: '#888780' }
  }
}

export function formatMinutes(minutes: number) {
  if (minutes < 60) return `${minutes} min`
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return m > 0 ? `${h}h ${m}min` : `${h}h`
}