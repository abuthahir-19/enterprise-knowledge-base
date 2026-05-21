import React, { useCallback, useState } from 'react'
import { Upload, File, X, Download, AlertCircle } from 'lucide-react'
import toast from 'react-hot-toast'
import fileService from '../../services/fileService.js'

const ALLOWED_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'image/jpeg',
  'image/png',
  'image/gif',
  'text/plain',
  'text/csv',
]

const MAX_SIZE_MB = 10
const MAX_SIZE_BYTES = MAX_SIZE_MB * 1024 * 1024

function formatSize(bytes) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function getFileIcon(type) {
  if (type?.startsWith('image/')) return '🖼️'
  if (type === 'application/pdf') return '📄'
  if (type?.includes('word')) return '📝'
  if (type?.includes('excel') || type?.includes('spreadsheet')) return '📊'
  return '📎'
}

export default function FileUpload({ articleId, existingFiles = [], onFilesChange }) {
  const [isDragging, setIsDragging] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState({})
  const [files, setFiles] = useState(existingFiles)

  const handleFiles = useCallback(async (fileList) => {
    const validFiles = []
    for (const file of fileList) {
      if (!ALLOWED_TYPES.includes(file.type)) {
        toast.error(`${file.name}: File type not allowed`)
        continue
      }
      if (file.size > MAX_SIZE_BYTES) {
        toast.error(`${file.name}: File too large (max ${MAX_SIZE_MB}MB)`)
        continue
      }
      validFiles.push(file)
    }

    if (validFiles.length === 0) return

    setUploading(true)
    const uploaded = []

    for (const file of validFiles) {
      const formData = new FormData()
      formData.append('file', file)
      if (articleId) formData.append('article_id', articleId)

      setUploadProgress((prev) => ({ ...prev, [file.name]: 0 }))

      try {
        const result = await fileService.uploadFile(formData)
        uploaded.push(result)
        setUploadProgress((prev) => ({ ...prev, [file.name]: 100 }))
        toast.success(`${file.name} uploaded`)
      } catch (err) {
        toast.error(`Failed to upload ${file.name}`)
        setUploadProgress((prev) => {
          const next = { ...prev }
          delete next[file.name]
          return next
        })
      }
    }

    const newFiles = [...files, ...uploaded]
    setFiles(newFiles)
    onFilesChange && onFilesChange(newFiles)
    setUploading(false)
    setTimeout(() => setUploadProgress({}), 2000)
  }, [articleId, files, onFilesChange])

  const handleDrop = useCallback(
    (e) => {
      e.preventDefault()
      setIsDragging(false)
      handleFiles(Array.from(e.dataTransfer.files))
    },
    [handleFiles]
  )

  const handleInputChange = (e) => {
    handleFiles(Array.from(e.target.files))
    e.target.value = ''
  }

  const handleDelete = async (fileId, fileName) => {
    try {
      await fileService.deleteFile(fileId)
      const newFiles = files.filter((f) => f.id !== fileId)
      setFiles(newFiles)
      onFilesChange && onFilesChange(newFiles)
      toast.success(`${fileName} deleted`)
    } catch {
      toast.error('Failed to delete file')
    }
  }

  return (
    <div className="space-y-4">
      {/* Drop zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        className={`relative border-2 border-dashed rounded-xl p-8 text-center transition-colors ${
          isDragging ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-blue-400 hover:bg-gray-50'
        }`}
      >
        <input
          type="file"
          multiple
          onChange={handleInputChange}
          accept={ALLOWED_TYPES.join(',')}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          disabled={uploading}
        />
        <Upload size={32} className={`mx-auto mb-3 ${isDragging ? 'text-blue-500' : 'text-gray-400'}`} />
        <p className="text-sm font-medium text-gray-700 mb-1">
          {uploading ? 'Uploading...' : 'Drag & drop files here, or click to browse'}
        </p>
        <p className="text-xs text-gray-400">
          Supported: PDF, Word, Excel, Images, Text, CSV — Max {MAX_SIZE_MB}MB each
        </p>
      </div>

      {/* Upload progress */}
      {Object.keys(uploadProgress).length > 0 && (
        <div className="space-y-2">
          {Object.entries(uploadProgress).map(([name, progress]) => (
            <div key={name} className="bg-gray-50 rounded-lg p-3">
              <div className="flex items-center justify-between text-sm mb-1">
                <span className="text-gray-700 truncate">{name}</span>
                <span className="text-gray-500 ml-2">{progress}%</span>
              </div>
              <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-500 rounded-full transition-all"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Uploaded files list */}
      {files.length > 0 && (
        <div className="border border-gray-200 rounded-xl overflow-hidden">
          <div className="bg-gray-50 px-4 py-2.5 border-b border-gray-200">
            <span className="text-sm font-medium text-gray-700">
              Attached Files ({files.length})
            </span>
          </div>
          <ul className="divide-y divide-gray-100">
            {files.map((file) => (
              <li key={file.id} className="flex items-center justify-between px-4 py-3 hover:bg-gray-50">
                <div className="flex items-center gap-3 min-w-0">
                  <span className="text-lg">{getFileIcon(file.content_type || file.type)}</span>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {file.original_filename || file.filename || file.name}
                    </p>
                    <p className="text-xs text-gray-400">
                      {formatSize(file.file_size || file.size || 0)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 ml-3">
                  <a
                    href={fileService.getDownloadUrl(file.id)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    title="Download"
                  >
                    <Download size={15} />
                  </a>
                  <button
                    onClick={() => handleDelete(file.id, file.original_filename || file.filename)}
                    className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    title="Delete"
                  >
                    <X size={15} />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
