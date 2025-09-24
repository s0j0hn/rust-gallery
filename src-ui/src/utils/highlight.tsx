import { ReactNode } from 'react'

export const highlightText = (text: string, query: string): ReactNode => {
  if (!query.trim() || !text) {
    return text
  }

  const parts = text.split(new RegExp(`(${query})`, 'gi'))

  return parts.map((part, index) =>
    part.toLowerCase() === query.toLowerCase() ? (
      <mark key={index} className="bg-yellow-200 rounded px-0.5">
        {part}
      </mark>
    ) : (
      part
    )
  )
}
