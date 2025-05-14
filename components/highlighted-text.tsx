import type React from "react"

interface HighlightedTextProps {
  text: string
  searchTerms: string[]
  maxLength?: number
}

export function HighlightedText({ text, searchTerms, maxLength = 300 }: HighlightedTextProps) {
  // If no search terms or empty text, just return the truncated text
  if (!searchTerms.length || !text) {
    return <span>{text.length > maxLength ? `${text.substring(0, maxLength)}...` : text}</span>
  }

  // Find the first occurrence of any search term
  let firstMatchIndex = -1
  let matchTerm = ""

  for (const term of searchTerms) {
    const index = text.toLowerCase().indexOf(term.toLowerCase())
    if (index !== -1 && (firstMatchIndex === -1 || index < firstMatchIndex)) {
      firstMatchIndex = index
      matchTerm = term
    }
  }

  // If no match found, just return the truncated text
  if (firstMatchIndex === -1) {
    return <span>{text.length > maxLength ? `${text.substring(0, maxLength)}...` : text}</span>
  }

  // Calculate the start and end indices for the excerpt
  const contextSize = Math.floor(maxLength / 2)
  let startIndex = Math.max(0, firstMatchIndex - contextSize)
  let endIndex = Math.min(text.length, firstMatchIndex + matchTerm.length + contextSize)

  // Adjust if the excerpt is shorter than maxLength
  if (endIndex - startIndex < maxLength) {
    if (startIndex === 0) {
      endIndex = Math.min(text.length, maxLength)
    } else if (endIndex === text.length) {
      startIndex = Math.max(0, text.length - maxLength)
    }
  }

  // Extract the excerpt
  let excerpt = text.substring(startIndex, endIndex)

  // Add ellipsis if needed
  if (startIndex > 0) {
    excerpt = `...${excerpt}`
  }
  if (endIndex < text.length) {
    excerpt = `${excerpt}...`
  }

  // Highlight all search terms in the excerpt
  const parts: React.ReactNode[] = []
  let lastIndex = 0

  // Create a regex pattern for all search terms
  const pattern = searchTerms
    .map((term) => term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")) // Escape special regex characters
    .join("|")

  const regex = new RegExp(`(${pattern})`, "gi")

  // Split the excerpt by matches and create highlighted spans
  let match
  while ((match = regex.exec(excerpt)) !== null) {
    const matchStart = match.index
    const matchEnd = matchStart + match[0].length

    // Add text before the match
    if (matchStart > lastIndex) {
      parts.push(<span key={`text-${lastIndex}`}>{excerpt.substring(lastIndex, matchStart)}</span>)
    }

    // Add the highlighted match
    parts.push(
      <span key={`highlight-${matchStart}`} className="bg-yellow-200 dark:bg-yellow-800 rounded px-0.5">
        {excerpt.substring(matchStart, matchEnd)}
      </span>,
    )

    lastIndex = matchEnd
  }

  // Add any remaining text
  if (lastIndex < excerpt.length) {
    parts.push(<span key={`text-${lastIndex}`}>{excerpt.substring(lastIndex)}</span>)
  }

  return <>{parts}</>
}
