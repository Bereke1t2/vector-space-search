// Vector Space Model implementation for client-side processing
import * as pdfjs from "pdfjs-dist"

// Type definitions
type DocumentData = {
  name: string
  content: string
  type: string
  tf: Record<string, number> // Term frequency
  tfidf: Record<string, number> // TF-IDF weights
  vector: Record<string, number> // Vector representation
  magnitude: number // Vector magnitude for cosine similarity
}

type ModelData = {
  documents: Record<string, DocumentData>
  idf: Record<string, number> // Inverse document frequency
  terms: string[] // All unique terms
}

// Global variable to store model data
export let modelData: ModelData | null = null

// English stopwords
const STOPWORDS = new Set([
  "a",
  "about",
  "above",
  "after",
  "again",
  "against",
  "all",
  "am",
  "an",
  "and",
  "any",
  "are",
  "aren't",
  "as",
  "at",
  "be",
  "because",
  "been",
  "before",
  "being",
  "below",
  "between",
  "both",
  "but",
  "by",
  "can't",
  "cannot",
  "could",
  "couldn't",
  "did",
  "didn't",
  "do",
  "does",
  "doesn't",
  "doing",
  "don't",
  "down",
  "during",
  "each",
  "few",
  "for",
  "from",
  "further",
  "had",
  "hadn't",
  "has",
  "hasn't",
  "have",
  "haven't",
  "having",
  "he",
  "he'd",
  "he'll",
  "he's",
  "her",
  "here",
  "here's",
  "hers",
  "herself",
  "him",
  "himself",
  "his",
  "how",
  "how's",
  "i",
  "i'd",
  "i'll",
  "i'm",
  "i've",
  "if",
  "in",
  "into",
  "is",
  "isn't",
  "it",
  "it's",
  "its",
  "itself",
  "let's",
  "me",
  "more",
  "most",
  "mustn't",
  "my",
  "myself",
  "no",
  "nor",
  "not",
  "of",
  "off",
  "on",
  "once",
  "only",
  "or",
  "other",
  "ought",
  "our",
  "ours",
  "ourselves",
  "out",
  "over",
  "own",
  "same",
  "shan't",
  "she",
  "she'd",
  "she'll",
  "she's",
  "should",
  "shouldn't",
  "so",
  "some",
  "such",
  "than",
  "that",
  "that's",
  "the",
  "their",
  "theirs",
  "them",
  "themselves",
  "then",
  "there",
  "there's",
  "these",
  "they",
  "they'd",
  "they'll",
  "they're",
  "they've",
  "this",
  "those",
  "through",
  "to",
  "too",
  "under",
  "until",
  "up",
  "very",
  "was",
  "wasn't",
  "we",
  "we'd",
  "we'll",
  "we're",
  "we've",
  "were",
  "weren't",
  "what",
  "what's",
  "when",
  "when's",
  "where",
  "where's",
  "which",
  "while",
  "who",
  "who's",
  "whom",
  "why",
  "why's",
  "with",
  "won't",
  "would",
  "wouldn't",
  "you",
  "you'd",
  "you'll",
  "you're",
  "you've",
  "your",
  "yours",
  "yourself",
  "yourselves",
])

// Extract text from different file types
export const extractTextFromFile = async (file: File): Promise<string> => {
  // For plain text files
  if (file.type === "text/plain") {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = (e) => resolve(e.target?.result as string)
      reader.onerror = reject
      reader.readAsText(file)
    })
  }

  // For PDF files
  else if (file.type === "application/pdf") {
    try {
      // Load the PDF.js library dynamically
      if (!pdfjs.GlobalWorkerOptions.workerSrc) {
        pdfjs.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`
      }

      const arrayBuffer = await file.arrayBuffer()
      const pdf = await pdfjs.getDocument({ data: arrayBuffer }).promise

      let text = ""
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i)
        const content = await page.getTextContent()
        const pageText = content.items.map((item: any) => item.str).join(" ")
        text += pageText + "\n"
      }

      return text
    } catch (error) {
      console.error("Error extracting text from PDF:", error)
      throw new Error("Failed to extract text from PDF")
    }
  }

  // For Word documents (DOCX)
  else if (
    file.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
    file.type === "application/msword"
  ) {
    try {
      // For simplicity, we'll use a basic approach to extract text from DOCX
      // In a real app, you'd use a proper library like mammoth.js
      const arrayBuffer = await file.arrayBuffer()

      // This is a simplified approach - in a real app, use a proper DOCX parser
      // Convert to string and extract text between tags
      const text = new TextDecoder("utf-8").decode(arrayBuffer)

      // Very basic extraction - just get text between XML tags
      return text
        .replace(/<[^>]*>/g, " ")
        .replace(/\s+/g, " ")
        .trim()
    } catch (error) {
      console.error("Error extracting text from Word document:", error)
      throw new Error("Failed to extract text from Word document")
    }
  }

  // For CSV files
  else if (file.type === "text/csv") {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = (e) => {
        const text = e.target?.result as string
        // Convert CSV to plain text by replacing commas with spaces
        resolve(text.replace(/,/g, " "))
      }
      reader.onerror = reject
      reader.readAsText(file)
    })
  }

  // For JSON files
  else if (file.type === "application/json") {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = (e) => {
        try {
          const jsonData = JSON.parse(e.target?.result as string)
          // Convert JSON to string representation
          resolve(JSON.stringify(jsonData, null, 2))
        } catch (error) {
          reject(new Error("Invalid JSON file"))
        }
      }
      reader.onerror = reject
      reader.readAsText(file)
    })
  }

  // For HTML files
  else if (file.type === "text/html") {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = (e) => {
        const html = e.target?.result as string
        // Strip HTML tags to get plain text
        const text = html
          .replace(/<[^>]*>/g, " ")
          .replace(/\s+/g, " ")
          .trim()
        resolve(text)
      }
      reader.onerror = reject
      reader.readAsText(file)
    })
  }

  // For XML files
  else if (file.type === "application/xml" || file.type === "text/xml") {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = (e) => {
        const xml = e.target?.result as string
        // Strip XML tags to get plain text
        const text = xml
          .replace(/<[^>]*>/g, " ")
          .replace(/\s+/g, " ")
          .trim()
        resolve(text)
      }
      reader.onerror = reject
      reader.readAsText(file)
    })
  }

  // Default fallback for other file types
  else {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = (e) => resolve(e.target?.result as string)
      reader.onerror = reject
      reader.readAsText(file)
    })
  }
}

// Tokenize text into words
const tokenize = (text: string): string[] => {
  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, " ") // Replace punctuation with spaces
    .split(/\s+/) // Split by whitespace
    .filter((word) => word.length > 0)
}

// Simple stemming function (Porter stemming algorithm simplified)
const stem = (word: string): string => {
  // Very basic stemming rules
  if (word.endsWith("ing")) return word.slice(0, -3)
  if (word.endsWith("ly")) return word.slice(0, -2)
  if (word.endsWith("ed")) return word.slice(0, -2)
  if (word.endsWith("s")) return word.slice(0, -1)
  if (word.endsWith("ment")) return word.slice(0, -4)
  if (word.endsWith("ness")) return word.slice(0, -4)
  return word
}

// Preprocess text: tokenize, remove stopwords, and stem
const preprocessText = (text: string): string[] => {
  const tokens = tokenize(text)
  return tokens.filter((token) => !STOPWORDS.has(token) && token.length > 1).map((token) => stem(token))
}

// Calculate term frequency for a document
const calculateTF = (tokens: string[]): Record<string, number> => {
  const tf: Record<string, number> = {}

  // Count occurrences of each term
  tokens.forEach((token) => {
    tf[token] = (tf[token] || 0) + 1
  })

  return tf
}

// Calculate inverse document frequency
const calculateIDF = (documentTerms: Record<string, Set<string>>, totalDocs: number): Record<string, number> => {
  const idf: Record<string, number> = {}
  const allTerms = new Set<string>()

  // Collect all unique terms
  Object.values(documentTerms).forEach((terms) => {
    terms.forEach((term) => allTerms.add(term))
  })

  // Calculate IDF for each term
  allTerms.forEach((term) => {
    let docsWithTerm = 0

    Object.values(documentTerms).forEach((terms) => {
      if (terms.has(term)) {
        docsWithTerm++
      }
    })

    // IDF formula: log(totalDocs / docsWithTerm)
    idf[term] = Math.log(totalDocs / docsWithTerm)
  })

  return idf
}

// Calculate TF-IDF weights
const calculateTFIDF = (tf: Record<string, number>, idf: Record<string, number>): Record<string, number> => {
  const tfidf: Record<string, number> = {}

  Object.keys(tf).forEach((term) => {
    if (idf[term] !== undefined) {
      tfidf[term] = tf[term] * idf[term]
    }
  })

  return tfidf
}

// Calculate vector magnitude (for cosine similarity)
const calculateMagnitude = (vector: Record<string, number>): number => {
  return Math.sqrt(Object.values(vector).reduce((sum, value) => sum + value * value, 0))
}

// Process documents and build the vector space model
export const processDocumentsClient = async (
  documents: Record<string, { name: string; content: string; type: string }>,
): Promise<void> => {
  // Initialize model data
  const model: ModelData = {
    documents: {},
    idf: {},
    terms: [],
  }

  // Step 1: Preprocess documents and calculate term frequencies
  const documentTerms: Record<string, Set<string>> = {}

  Object.entries(documents).forEach(([docId, doc]) => {
    const tokens = preprocessText(doc.content)
    const tf = calculateTF(tokens)
    const uniqueTerms = new Set(tokens)

    documentTerms[docId] = uniqueTerms

    model.documents[docId] = {
      name: doc.name,
      content: doc.content,
      type: doc.type,
      tf,
      tfidf: {}, // Will be calculated later
      vector: {}, // Will be calculated later
      magnitude: 0, // Will be calculated later
    }
  })

  // Step 2: Calculate IDF
  model.idf = calculateIDF(documentTerms, Object.keys(documents).length)
  model.terms = Object.keys(model.idf)

  // Step 3: Calculate TF-IDF weights and document vectors
  Object.entries(model.documents).forEach(([docId, doc]) => {
    doc.tfidf = calculateTFIDF(doc.tf, model.idf)
    doc.vector = { ...doc.tfidf } // Vector is the same as TF-IDF weights
    doc.magnitude = calculateMagnitude(doc.vector)
  })

  // Store model data
  modelData = model

  // Optionally store in localStorage for persistence
  try {
    localStorage.setItem("vectorSpaceModelData", JSON.stringify(model))
  } catch (error) {
    console.warn("Failed to store model data in localStorage:", error)
  }
}

// Calculate cosine similarity between two vectors
const cosineSimilarity = (
  vectorA: Record<string, number>,
  magnitudeA: number,
  vectorB: Record<string, number>,
  magnitudeB: number,
): number => {
  // If either vector has zero magnitude, similarity is 0
  if (magnitudeA === 0 || magnitudeB === 0) return 0

  // Calculate dot product
  let dotProduct = 0
  Object.keys(vectorA).forEach((term) => {
    if (vectorB[term]) {
      dotProduct += vectorA[term] * vectorB[term]
    }
  })

  // Calculate cosine similarity
  return dotProduct / (magnitudeA * magnitudeB)
}

// Search documents using the vector space model
export const searchDocumentsClient = (query: string): any[] => {
  if (!modelData) {
    throw new Error("No documents have been processed. Please process documents first.")
  }

  // Preprocess query
  const queryTokens = preprocessText(query)

  // Calculate query term frequency
  const queryTF = calculateTF(queryTokens)

  // Calculate query TF-IDF weights
  const queryTFIDF = calculateTFIDF(queryTF, modelData.idf)

  // Calculate query vector magnitude
  const queryMagnitude = calculateMagnitude(queryTFIDF)

  // Calculate similarity between query and each document
  const results = Object.entries(modelData.documents).map(([docId, doc]) => {
    const similarity = cosineSimilarity(queryTFIDF, queryMagnitude, doc.vector, doc.magnitude)

    // Find matching terms between query and document
    const matchingTerms = queryTokens.filter((term) => doc.tf[term] > 0)

    return {
      docId,
      document: {
        name: doc.name,
        content: doc.content,
        type: doc.type,
      },
      similarity,
      queryTerms: queryTokens,
      matchingTerms,
    }
  })

  // Sort results by similarity (descending)
  return results.filter((result) => result.similarity > 0).sort((a, b) => b.similarity - a.similarity)
}

// Try to load model data from localStorage on initialization
try {
  const storedData = localStorage.getItem("vectorSpaceModelData")
  if (storedData) {
    modelData = JSON.parse(storedData)
  }
} catch (error) {
  console.warn("Failed to load model data from localStorage:", error)
}
