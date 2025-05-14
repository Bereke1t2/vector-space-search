"use client"

import type React from "react"

import { useState, useRef, useCallback, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"
import { ThemeToggle } from "@/components/theme-toggle"
import {
  Upload,
  FileText,
  SearchIcon,
  AlertCircle,
  FileUp,
  Type,
  X,
  ChevronRight,
  BarChart2,
  FileSymlink,
  Trash2,
  FileQuestion,
  FileIcon as FilePdf,
  FileImage,
  FileSpreadsheet,
  FileCode,
  FileJson,
  FileArchive,
  FileAudio,
  FileVideo,
} from "lucide-react"
import {
  processDocumentsClient,
  searchDocumentsClient,
  modelData,
  extractTextFromFile,
} from "@/lib/vector-space-model-client"
import { motion, AnimatePresence } from "framer-motion"
import { HighlightedText } from "@/components/highlighted-text"

// File type icons mapping
const fileIcons: Record<string, React.ReactNode> = {
  "text/plain": <FileText className="h-6 w-6 text-blue-500" />,
  "application/pdf": <FilePdf className="h-6 w-6 text-red-500" />,
  "application/msword": <FileText className="h-6 w-6 text-blue-700" />,
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": (
    <FileText className="h-6 w-6 text-blue-700" />
  ),
  "application/vnd.ms-excel": <FileSpreadsheet className="h-6 w-6 text-green-600" />,
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": (
    <FileSpreadsheet className="h-6 w-6 text-green-600" />
  ),
  "application/json": <FileJson className="h-6 w-6 text-yellow-500" />,
  "text/csv": <FileSpreadsheet className="h-6 w-6 text-green-500" />,
  "text/html": <FileCode className="h-6 w-6 text-orange-500" />,
  "application/xml": <FileCode className="h-6 w-6 text-purple-500" />,
  "application/zip": <FileArchive className="h-6 w-6 text-gray-600" />,
  image: <FileImage className="h-6 w-6 text-pink-500" />,
  audio: <FileAudio className="h-6 w-6 text-indigo-500" />,
  video: <FileVideo className="h-6 w-6 text-red-600" />,
  default: <FileQuestion className="h-6 w-6 text-gray-500" />,
}

// Get icon for file type
const getFileIcon = (type: string) => {
  if (type.startsWith("image/")) return fileIcons["image"]
  if (type.startsWith("audio/")) return fileIcons["audio"]
  if (type.startsWith("video/")) return fileIcons["video"]
  return fileIcons[type] || fileIcons["default"]
}

// Supported file types
const SUPPORTED_FILE_TYPES = [
  "text/plain",
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "text/csv",
  "application/json",
  "text/html",
  "application/xml",
]

export default function Home() {
  const [documents, setDocuments] = useState<{ id: string; name: string; content: string; type: string }[]>([])
  const [activeTab, setActiveTab] = useState("upload")
  const [searchQuery, setSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [uploadMethod, setUploadMethod] = useState<"file" | "text">("file")
  const [textInput, setTextInput] = useState("")
  const [textDocName, setTextDocName] = useState("")
  const [isProcessing, setIsProcessing] = useState(false)
  const [processingProgress, setProcessingProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [dragActive, setDragActive] = useState(false)
  const [processingFile, setProcessingFile] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Simulate progress for better UX
  useEffect(() => {
    let interval: NodeJS.Timeout
    if (isProcessing) {
      interval = setInterval(() => {
        setProcessingProgress((prev) => {
          const newProgress = prev + (100 - prev) * 0.1
          return newProgress > 95 ? 95 : newProgress
        })
      }, 200)
    } else {
      setProcessingProgress(0)
    }
    return () => clearInterval(interval)
  }, [isProcessing])

  // Handle file upload
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null)
    if (e.target.files && e.target.files.length > 0) {
      processFiles(e.target.files)
    }
  }

  // Process uploaded files
  const processFiles = async (files: FileList) => {
    const newDocuments = [...documents]
    const filePromises = Array.from(files).map(async (file) => {
      try {
        setProcessingFile(file.name)

        // Check if file type is supported
        const isSupported = SUPPORTED_FILE_TYPES.some(
          (type) => file.type === type || (type.includes("*") && file.type.startsWith(type.replace("*", ""))),
        )

        if (!isSupported) {
          setError(
            `File "${file.name}" (${file.type || "unknown type"}) is not supported. Please upload text, PDF, Word, CSV, JSON, HTML, or XML files.`,
          )
          return
        }

        // Extract text from file based on type
        const content = await extractTextFromFile(file)

        if (!content || content.trim() === "") {
          setError(`Could not extract text from "${file.name}". The file may be empty or corrupted.`)
          return
        }

        const id = `doc-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
        newDocuments.push({ id, name: file.name, content, type: file.type })
      } catch (err) {
        setError(`Error processing file "${file.name}": ${err instanceof Error ? err.message : String(err)}`)
      } finally {
        setProcessingFile(null)
      }
    })

    await Promise.all(filePromises)
    setDocuments(newDocuments)
  }

  // Handle drag events
  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }, [])

  // Handle drop event
  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      e.stopPropagation()
      setDragActive(false)
      if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        processFiles(e.dataTransfer.files)
      }
    },
    [documents],
  )

  // Add text document
  const handleAddTextDocument = () => {
    if (!textInput.trim()) {
      setError("Please enter some text content.")
      return
    }

    const name = textDocName.trim() ? `${textDocName}.txt` : `Document-${documents.length + 1}.txt`
    const id = `doc-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
    setDocuments([...documents, { id, name, content: textInput, type: "text/plain" }])
    setTextInput("")
    setTextDocName("")
  }

  // Process documents
  const handleProcessDocuments = async () => {
    if (documents.length === 0) {
      setError("Please upload at least one document.")
      return
    }

    setIsProcessing(true)
    setError(null)
    setProcessingProgress(10)

    try {
      const docMap = documents.reduce(
        (acc, doc) => {
          acc[doc.id] = { name: doc.name, content: doc.content, type: doc.type }
          return acc
        },
        {} as Record<string, { name: string; content: string; type: string }>,
      )

      await processDocumentsClient(docMap)
      setProcessingProgress(100)
      setTimeout(() => {
        setActiveTab("stats")
        setIsProcessing(false)
      }, 500)
    } catch (err) {
      setError(`Error processing documents: ${err instanceof Error ? err.message : String(err)}`)
      setIsProcessing(false)
    }
  }

  // Handle search
  const handleSearch = () => {
    if (!searchQuery.trim()) {
      setError("Please enter a search query.")
      return
    }

    if (!modelData || !modelData.documents || Object.keys(modelData.documents).length === 0) {
      setError("No documents have been processed. Please process documents first.")
      setActiveTab("upload")
      return
    }

    setError(null)
    const results = searchDocumentsClient(searchQuery)
    setSearchResults(results)
  }

  // Remove a document
  const removeDocument = (id: string) => {
    setDocuments(documents.filter((doc) => doc.id !== id))
  }

  // Clear all documents
  const clearAllDocuments = () => {
    setDocuments([])
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      <div className="container mx-auto py-8 px-4">
        <div className="relative text-center mb-8">
          <div className="absolute right-0 top-0">
            <ThemeToggle />
          </div>
          <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-pink-600 mb-2">
            Vector Space Model Search Engine
          </h1>
          <p className="text-slate-600 dark:text-slate-300 max-w-2xl mx-auto">
            Upload documents, process them with the vector space model, and perform semantic searches with ranked
            results.
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full max-w-5xl mx-auto">
          <TabsList className="grid w-full grid-cols-3 mb-8">
            <TabsTrigger
              value="upload"
              className="data-[state=active]:bg-purple-100 dark:data-[state=active]:bg-purple-900"
            >
              <Upload className="mr-2 h-4 w-4" />
              Upload Documents
            </TabsTrigger>
            <TabsTrigger
              value="stats"
              disabled={!modelData || !modelData.documents}
              className="data-[state=active]:bg-purple-100 dark:data-[state=active]:bg-purple-900"
            >
              <BarChart2 className="mr-2 h-4 w-4" />
              Statistics
            </TabsTrigger>
            <TabsTrigger
              value="search"
              disabled={!modelData || !modelData.documents}
              className="data-[state=active]:bg-purple-100 dark:data-[state=active]:bg-purple-900"
            >
              <SearchIcon className="mr-2 h-4 w-4" />
              Search
            </TabsTrigger>
          </TabsList>

          {/* Upload Tab */}
          <TabsContent value="upload" className="space-y-6">
            <AnimatePresence>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
              >
                <Card className="border-none shadow-lg">
                  <CardHeader className="bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-t-lg">
                    <CardTitle className="flex items-center text-2xl">
                      <FileSymlink className="mr-2 h-6 w-6" />
                      Document Upload
                    </CardTitle>
                    <CardDescription className="text-purple-100">
                      Upload files or enter text directly to process with the vector space model.
                    </CardDescription>
                    <div className="flex space-x-2 mt-4">
                      <Button
                        variant={uploadMethod === "file" ? "secondary" : "outline"}
                        onClick={() => setUploadMethod("file")}
                        size="sm"
                        className={
                          uploadMethod === "file"
                            ? "bg-white text-purple-700"
                            : "bg-purple-400/20 text-white border-purple-200"
                        }
                      >
                        <FileUp className="mr-2 h-4 w-4" />
                        File Upload
                      </Button>
                      <Button
                        variant={uploadMethod === "text" ? "secondary" : "outline"}
                        onClick={() => setUploadMethod("text")}
                        size="sm"
                        className={
                          uploadMethod === "text"
                            ? "bg-white text-purple-700"
                            : "bg-purple-400/20 text-white border-purple-200"
                        }
                      >
                        <Type className="mr-2 h-4 w-4" />
                        Text Input
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-6">
                    {uploadMethod === "file" ? (
                      <div
                        className={`border-2 border-dashed rounded-lg p-10 text-center transition-all duration-200 ${
                          dragActive
                            ? "border-purple-500 bg-purple-50 dark:bg-purple-900/20"
                            : "border-slate-300 dark:border-slate-700 hover:border-purple-300 dark:hover:border-purple-700"
                        }`}
                        onDragEnter={handleDrag}
                        onDragOver={handleDrag}
                        onDragLeave={handleDrag}
                        onDrop={handleDrop}
                        onClick={() => fileInputRef.current?.click()}
                      >
                        <input
                          ref={fileInputRef}
                          type="file"
                          multiple
                          accept=".txt,.pdf,.doc,.docx,.csv,.json,.html,.xml"
                          onChange={handleFileChange}
                          className="hidden"
                        />
                        <div className="flex flex-col items-center justify-center space-y-4 cursor-pointer">
                          <div className="w-20 h-20 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                            <Upload className="h-10 w-10 text-purple-500 dark:text-purple-400" />
                          </div>
                          <div>
                            <p className="text-lg font-medium text-slate-800 dark:text-slate-200">
                              Drag and drop files here or click to browse
                            </p>
                            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                              Supports TXT, PDF, DOC, DOCX, CSV, JSON, HTML, and XML files
                            </p>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <div>
                          <label
                            htmlFor="docName"
                            className="block text-sm font-medium mb-1 text-slate-700 dark:text-slate-300"
                          >
                            Document Name (optional)
                          </label>
                          <Input
                            id="docName"
                            placeholder="Enter document name"
                            value={textDocName}
                            onChange={(e) => setTextDocName(e.target.value)}
                            className="border-slate-300 dark:border-slate-700"
                          />
                        </div>
                        <div>
                          <label
                            htmlFor="docContent"
                            className="block text-sm font-medium mb-1 text-slate-700 dark:text-slate-300"
                          >
                            Document Content
                          </label>
                          <Textarea
                            id="docContent"
                            placeholder="Enter document text here..."
                            rows={8}
                            value={textInput}
                            onChange={(e) => setTextInput(e.target.value)}
                            className="border-slate-300 dark:border-slate-700 resize-none"
                          />
                        </div>
                        <Button
                          onClick={handleAddTextDocument}
                          className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                        >
                          Add Document
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            </AnimatePresence>

            {/* Document List */}
            {documents.length > 0 && (
              <AnimatePresence>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3, delay: 0.1 }}
                >
                  <Card className="border-none shadow-lg">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                      <div>
                        <CardTitle className="text-xl flex items-center">
                          <FileText className="mr-2 h-5 w-5 text-purple-500" />
                          Documents ({documents.length})
                        </CardTitle>
                        <CardDescription>Review your documents before processing.</CardDescription>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={clearAllDocuments}
                        className="text-red-500 border-red-200 hover:bg-red-50 hover:text-red-600 dark:border-red-800 dark:hover:bg-red-900/20"
                      >
                        <Trash2 className="h-4 w-4 mr-1" />
                        Clear All
                      </Button>
                    </CardHeader>
                    <CardContent>
                      <ScrollArea className="h-[300px] pr-4">
                        <div className="space-y-3">
                          {documents.map((doc) => (
                            <motion.div
                              key={doc.id}
                              initial={{ opacity: 0, x: -20 }}
                              animate={{ opacity: 1, x: 0 }}
                              exit={{ opacity: 0, x: 20 }}
                              transition={{ duration: 0.2 }}
                              className="flex items-center justify-between p-4 border rounded-lg bg-white dark:bg-slate-800 shadow-sm hover:shadow-md transition-shadow"
                            >
                              <div className="flex items-center">
                                {getFileIcon(doc.type)}
                                <div className="ml-3">
                                  <p className="font-medium text-slate-800 dark:text-slate-200">{doc.name}</p>
                                  <div className="flex items-center mt-1">
                                    <Badge variant="outline" className="text-xs mr-2">
                                      {doc.type.split("/")[1] || doc.type}
                                    </Badge>
                                    <p className="text-xs text-slate-500 dark:text-slate-400">
                                      {`${doc.content.length.toLocaleString()} characters`}
                                    </p>
                                  </div>
                                  <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 line-clamp-1">
                                    {doc.content.substring(0, 100)}
                                  </p>
                                </div>
                              </div>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => removeDocument(doc.id)}
                                className="text-slate-400 hover:text-red-500 dark:text-slate-500 dark:hover:text-red-400"
                              >
                                <X className="h-5 w-5" />
                              </Button>
                            </motion.div>
                          ))}
                        </div>
                      </ScrollArea>
                    </CardContent>
                    <CardFooter className="flex justify-center pt-2 pb-4">
                      <Button
                        onClick={handleProcessDocuments}
                        disabled={isProcessing || documents.length === 0}
                        className="w-full max-w-md bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                        size="lg"
                      >
                        {isProcessing ? (
                          <div className="flex items-center">
                            <span className="mr-2">Processing Documents...</span>
                            <Progress value={processingProgress} className="w-20 h-2" />
                          </div>
                        ) : (
                          <div className="flex items-center">
                            <span>Process Documents</span>
                            <ChevronRight className="ml-2 h-4 w-4" />
                          </div>
                        )}
                      </Button>
                    </CardFooter>
                  </Card>
                </motion.div>
              </AnimatePresence>
            )}

            {processingFile && (
              <Alert className="bg-blue-50 border-blue-200 text-blue-800 dark:bg-blue-900/30 dark:border-blue-800 dark:text-blue-300">
                <div className="flex items-center">
                  <FileSymlink className="h-4 w-4 mr-2" />
                  <AlertTitle>Processing file</AlertTitle>
                </div>
                <AlertDescription>Extracting text from {processingFile}...</AlertDescription>
              </Alert>
            )}
          </TabsContent>

          {/* Statistics Tab */}
          <TabsContent value="stats">
            <AnimatePresence>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
              >
                <Card className="border-none shadow-lg">
                  <CardHeader className="bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-t-lg">
                    <CardTitle className="flex items-center text-2xl">
                      <BarChart2 className="mr-2 h-6 w-6" />
                      Document Statistics
                    </CardTitle>
                    <CardDescription className="text-indigo-100">
                      Overview of processed documents and terms.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pt-6">
                    {modelData && (
                      <div className="space-y-8">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                          <Card className="border-none shadow-md bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20">
                            <CardHeader className="pb-2">
                              <CardTitle className="text-lg text-purple-700 dark:text-purple-300">Documents</CardTitle>
                            </CardHeader>
                            <CardContent>
                              <p className="text-4xl font-bold text-purple-600 dark:text-purple-400">
                                {Object.keys(modelData.documents).length}
                              </p>
                            </CardContent>
                          </Card>
                          <Card className="border-none shadow-md bg-gradient-to-br from-pink-50 to-purple-50 dark:from-pink-900/20 dark:to-purple-900/20">
                            <CardHeader className="pb-2">
                              <CardTitle className="text-lg text-pink-700 dark:text-pink-300">Unique Terms</CardTitle>
                            </CardHeader>
                            <CardContent>
                              <p className="text-4xl font-bold text-pink-600 dark:text-pink-400">
                                {Object.keys(modelData.idf).length}
                              </p>
                            </CardContent>
                          </Card>
                          <Card className="border-none shadow-md bg-gradient-to-br from-indigo-50 to-blue-50 dark:from-indigo-900/20 dark:to-blue-900/20">
                            <CardHeader className="pb-2">
                              <CardTitle className="text-lg text-indigo-700 dark:text-indigo-300">
                                Total Tokens
                              </CardTitle>
                            </CardHeader>
                            <CardContent>
                              <p className="text-4xl font-bold text-indigo-600 dark:text-indigo-400">
                                {Object.values(modelData.documents).reduce(
                                  (sum, doc) => sum + Object.values(doc.tf).reduce((a, b) => a + b, 0),
                                  0,
                                )}
                              </p>
                            </CardContent>
                          </Card>
                        </div>

                        <div>
                          <h3 className="text-xl font-semibold mb-4 text-slate-800 dark:text-slate-200 flex items-center">
                            <FileText className="mr-2 h-5 w-5 text-purple-500" />
                            Document Details
                          </h3>
                          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md overflow-hidden">
                            <Table>
                              <TableHeader className="bg-slate-50 dark:bg-slate-700">
                                <TableRow>
                                  <TableHead className="font-semibold">Document</TableHead>
                                  <TableHead className="font-semibold">Tokens</TableHead>
                                  <TableHead className="font-semibold">Unique Terms</TableHead>
                                  <TableHead className="font-semibold">Type</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {Object.entries(modelData.documents).map(([docId, doc]) => (
                                  <TableRow key={docId} className="hover:bg-slate-50 dark:hover:bg-slate-700/50">
                                    <TableCell className="font-medium">{doc.name}</TableCell>
                                    <TableCell>{Object.values(doc.tf).reduce((a, b) => a + b, 0)}</TableCell>
                                    <TableCell>{Object.keys(doc.tf).length}</TableCell>
                                    <TableCell>
                                      <Badge variant="outline" className="bg-slate-50 dark:bg-slate-800">
                                        {doc.type ? doc.type.split("/")[1] || doc.type : "text"}
                                      </Badge>
                                    </TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          </div>
                        </div>

                        <div>
                          <h3 className="text-xl font-semibold mb-4 text-slate-800 dark:text-slate-200 flex items-center">
                            <BarChart2 className="mr-2 h-5 w-5 text-purple-500" />
                            Top Terms by IDF
                          </h3>
                          <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-md">
                            <div className="flex flex-wrap gap-2">
                              {Object.entries(modelData.idf)
                                .sort((a, b) => b[1] - a[1])
                                .slice(0, 30)
                                .map(([term, idf], index) => (
                                  <Badge
                                    key={term}
                                    variant="secondary"
                                    className={`text-sm py-1 px-3 ${
                                      index < 10
                                        ? "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200"
                                        : "bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-slate-200"
                                    }`}
                                  >
                                    {term} ({idf.toFixed(2)})
                                  </Badge>
                                ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            </AnimatePresence>
          </TabsContent>

          {/* Search Tab */}
          <TabsContent value="search">
            <AnimatePresence>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
              >
                <Card className="border-none shadow-lg">
                  <CardHeader className="bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-t-lg">
                    <CardTitle className="flex items-center text-2xl">
                      <SearchIcon className="mr-2 h-6 w-6" />
                      Search Documents
                    </CardTitle>
                    <CardDescription className="text-blue-100">
                      Enter a query to search across processed documents using the vector space model.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pt-6">
                    <div className="flex space-x-2">
                      <div className="relative flex-1">
                        <Input
                          placeholder="Enter search query..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                          className="pl-10 border-slate-300 dark:border-slate-700 h-12"
                        />
                        <SearchIcon className="absolute left-3 top-3.5 h-5 w-5 text-slate-400" />
                      </div>
                      <Button
                        onClick={handleSearch}
                        className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 h-12 px-6"
                      >
                        <SearchIcon className="mr-2 h-4 w-4" />
                        Search
                      </Button>
                    </div>

                    {searchResults.length > 0 && (
                      <motion.div
                        className="mt-8"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.3 }}
                      >
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="text-xl font-semibold text-slate-800 dark:text-slate-200">
                            Search Results ({searchResults.length})
                          </h3>
                          <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                            Query: "{searchQuery}"
                          </Badge>
                        </div>

                        {searchResults.length > 0 && (
                          <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                            <p className="text-sm text-blue-700 dark:text-blue-300 mb-2">Query terms:</p>
                            <div className="flex flex-wrap gap-2">
                              {searchResults[0].queryTerms.map((term: string) => (
                                <Badge key={term} variant="outline" className="bg-white dark:bg-slate-800">
                                  {term}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}

                        <div className="space-y-4">
                          {searchResults.map((result, index) => (
                            <motion.div
                              key={index}
                              initial={{ opacity: 0, y: 20 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ duration: 0.3, delay: index * 0.05 }}
                            >
                              <Card className="overflow-hidden border-none shadow-md hover:shadow-lg transition-shadow">
                                <CardHeader className="py-4 bg-gradient-to-r from-slate-50 to-blue-50 dark:from-slate-800 dark:to-blue-900/20">
                                  <div className="flex justify-between items-center">
                                    <div className="flex items-center">
                                      {getFileIcon(result.document.type || "text/plain")}
                                      <CardTitle className="ml-2">{result.document.name}</CardTitle>
                                    </div>
                                    <Badge className="bg-gradient-to-r from-blue-500 to-indigo-500 text-white">
                                      Score: {result.similarity.toFixed(4)}
                                    </Badge>
                                  </div>
                                </CardHeader>
                                <CardContent className="pt-4">
                                  <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-lg mb-4">
                                    <p className="text-slate-700 dark:text-slate-300 whitespace-pre-wrap">
                                      <HighlightedText
                                        text={result.document.content}
                                        searchTerms={result.matchingTerms}
                                        maxLength={300}
                                      />
                                    </p>
                                  </div>
                                  <Separator className="my-4" />
                                  <div>
                                    <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">Matching terms:</p>
                                    <div className="flex flex-wrap gap-1.5">
                                      {result.matchingTerms.map((term: string) => (
                                        <Badge
                                          key={term}
                                          variant="secondary"
                                          className="text-xs bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200"
                                        >
                                          {term}
                                        </Badge>
                                      ))}
                                    </div>
                                  </div>
                                </CardContent>
                              </Card>
                            </motion.div>
                          ))}
                        </div>
                      </motion.div>
                    )}

                    {searchQuery && searchResults.length === 0 && (
                      <motion.div
                        className="mt-8 text-center p-12 border border-dashed rounded-lg"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.3 }}
                      >
                        <SearchIcon className="mx-auto h-12 w-12 text-slate-300 dark:text-slate-600 mb-4" />
                        <p className="text-xl font-medium text-slate-700 dark:text-slate-300">No results found</p>
                        <p className="text-slate-500 dark:text-slate-400 mt-2 max-w-md mx-auto">
                          Try different search terms, check your document collection, or upload more documents.
                        </p>
                      </motion.div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            </AnimatePresence>
          </TabsContent>
        </Tabs>

        {/* Error Alert */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="mt-6 max-w-5xl mx-auto"
            >
              <Alert
                variant="destructive"
                className="border-red-200 bg-red-50 text-red-800 dark:border-red-900 dark:bg-red-900/20 dark:text-red-300"
              >
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </main>
  )
}
