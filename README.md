# Vector Space Model Search Engine


A modern, interactive search engine that implements the Vector Space Model for information retrieval. This application allows users to upload multiple documents in various formats, process them using the vector space model, and perform semantic searches with ranked results.

## Table of Contents

- [Features](#features)
- [Demo](#demo)
- [How It Works](#how-it-works)
- [Project Setup](#project-setup)
- [Usage Guide](#usage-guide)
- [Technical Implementation](#technical-implementation)
- [File Structure](#file-structure)
- [Customization](#customization)
- [Troubleshooting](#troubleshooting)

## Features

- **Multiple File Format Support**:
  - Text Files (.txt)
  - PDF Documents (.pdf)
  - Word Documents (.doc, .docx)
  - CSV Files (.csv)
  - JSON Files (.json)
  - HTML Files (.html)
  - XML Files (.xml)

- **Document Processing**:
  - Text tokenization
  - Stopword removal
  - Word stemming
  - Term frequency (TF) calculation
  - Inverse document frequency (IDF) calculation
  - TF-IDF weighting

- **Search Capabilities**:
  - Semantic search using vector space model
  - Cosine similarity for document ranking
  - Matching term highlighting
  - Detailed search results

- **User Interface**:
  - Modern, responsive design
  - Drag-and-drop file upload
  - Document statistics visualization
  - Interactive search results
  - Animations and transitions
  - **Light and dark mode support with theme toggle**
  - **Search term highlighting in results**

## Demo

The application consists of three main sections:

1. **Upload Documents**: Upload files or enter text directly
2. **Statistics**: View document statistics and term frequencies
3. **Search**: Search across documents and view ranked results

## How It Works

### Vector Space Model Explained

The Vector Space Model represents documents and queries as vectors in a high-dimensional space, where each dimension corresponds to a term in the vocabulary. This allows for:

1. **Mathematical representation** of documents and queries
2. **Similarity calculation** between documents and queries
3. **Ranked retrieval** based on relevance scores

### Key Concepts

1. **Term Frequency (TF)**:
   - Measures how frequently a term occurs in a document
   - Formula: TF(t,d) = Number of times term t appears in document d

2. **Inverse Document Frequency (IDF)**:
   - Measures how important a term is across all documents
   - Formula: IDF(t) = log(Total number of documents / Number of documents containing term t)

3. **TF-IDF Weight**:
   - Combines TF and IDF to give importance to terms that are frequent in a document but rare across all documents
   - Formula: TF-IDF(t,d) = TF(t,d) × IDF(t)

4. **Cosine Similarity**:
   - Measures the similarity between two vectors (documents or queries)
   - Formula: cos(θ) = (A·B) / (||A|| × ||B||)
   - Where A·B is the dot product and ||A||, ||B|| are the magnitudes

## Project Setup

### Prerequisites

- Node.js (version 16.x or higher)
- npm or yarn package manager

### Installation

1. **Clone the repository**:

\`\`\`bash
git clone https://github.com/yourusername/vector-space-search.git
cd vector-space-search
\`\`\`

## Example Documents

The project includes example documents in the `examples` folder that you can use to test the search engine:

- `sample1.txt`: Information about Information Retrieval Systems
- `sample2.txt`: Information about the Vector Space Model
- `sample3.txt`: Information about Natural Language Processing

These sample documents can be used to quickly test the functionality of the search engine without having to create your own test files.
