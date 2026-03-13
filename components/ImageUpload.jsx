'use client'
import React, { useState, useRef, useCallback } from 'react'
import { Upload, X, Image as ImageIcon, AlertCircle, Check } from 'lucide-react'
import Button from './Button'

const ImageUpload = ({ 
  images = [], 
  onChange, 
  maxImages = 5, 
  maxSize = 5 * 1024 * 1024, // 5MB
  allowedTypes = ['image/jpeg', 'image/png', 'image/webp'],
  className = '',
  showPreview = true,
  dragAndDrop = true
}) => {
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const [dragActive, setDragActive] = useState(false)
  const fileInputRef = useRef(null)

  const validateFile = (file) => {
    // Check file type
    if (!allowedTypes.includes(file.type)) {
      setError(`Invalid file type. Only ${allowedTypes.map(type => type.split('/')[1]).join(', ')} files are allowed.`)
      return false
    }

    // Check file size
    if (file.size > maxSize) {
      setError(`File size too large. Maximum size is ${maxSize / (1024 * 1024)}MB.`)
      return false
    }

    return true
  }

  const processFiles = useCallback((files) => {
    setError('')
    const validFiles = []
    const invalidFiles = []

    Array.from(files).forEach(file => {
      if (validateFile(file)) {
        validFiles.push(file)
      } else {
        invalidFiles.push(file.name)
      }
    })

    if (invalidFiles.length > 0) {
      setError(`The following files were not uploaded: ${invalidFiles.join(', ')}`)
    }

    if (validFiles.length === 0) return

    // Check max images limit
    const totalImages = images.length + validFiles.length
    if (totalImages > maxImages) {
      setError(`Maximum ${maxImages} images allowed. You can upload ${maxImages - images.length} more.`)
      return
    }

    // Process valid files
    setUploading(true)
    const newImages = []

    validFiles.forEach(file => {
      const reader = new FileReader()
      reader.onload = (e) => {
        const imageData = {
          id: Date.now() + Math.random(),
          file,
          url: e.target.result,
          name: file.name,
          size: file.size,
          type: file.type
        }
        newImages.push(imageData)

        // When all files are processed
        if (newImages.length === validFiles.length) {
          setUploading(false)
          onChange([...images, ...newImages])
        }
      }
      reader.readAsDataURL(file)
    })
  }, [images, onChange, maxImages, allowedTypes, maxSize])

  const handleFileSelect = (e) => {
    const files = e.target.files
    if (files && files.length > 0) {
      processFiles(files)
    }
  }

  const handleDrag = (e) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }

  const handleDrop = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFiles(e.dataTransfer.files)
    }
  }

  const removeImage = (imageId) => {
    const updatedImages = images.filter(img => img.id !== imageId)
    onChange(updatedImages)
  }

  const triggerFileInput = () => {
    fileInputRef.current?.click()
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Upload Area */}
      <div
        className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
          dragActive 
            ? 'border-green-500 bg-green-50 dark:bg-green-900/20' 
            : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
        }`}
        onDragEnter={dragAndDrop ? handleDrag : undefined}
        onDragLeave={dragAndDrop ? handleDrag : undefined}
        onDragOver={dragAndDrop ? handleDrag : undefined}
        onDrop={dragAndDrop ? handleDrop : undefined}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept={allowedTypes.join(',')}
          onChange={handleFileSelect}
          className="hidden"
        />

        <div className="flex flex-col items-center space-y-4">
          <div className={`p-4 rounded-full ${
            dragActive 
              ? 'bg-green-100 dark:bg-green-800' 
              : 'bg-gray-100 dark:bg-gray-800'
          }`}>
            {uploading ? (
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
            ) : (
              <Upload size={32} className="text-gray-600 dark:text-gray-400" />
            )}
          </div>

          <div>
            <p className="text-lg font-medium text-gray-900 dark:text-gray-100">
              {uploading ? 'Uploading...' : 'Drop images here or click to upload'}
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              {maxImages - images.length} more images allowed • Max {maxSize / (1024 * 1024)}MB each
            </p>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
              Supported formats: {allowedTypes.map(type => type.split('/')[1]).join(', ')}
            </p>
          </div>

          {!dragAndDrop && (
            <Button
              onClick={triggerFileInput}
              disabled={uploading || images.length >= maxImages}
              variant="outline"
            >
              Select Images
            </Button>
          )}
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="flex items-center space-x-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <AlertCircle size={16} className="text-red-600 dark:text-red-400 flex-shrink-0" />
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        </div>
      )}

      {/* Image Preview Grid */}
      {showPreview && images.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {images.map((image, index) => (
            <div key={image.id} className="relative group">
              <div className="aspect-square overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700">
                <img
                  src={image.url}
                  alt={image.name || `Image ${index + 1}`}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                />
              </div>

              {/* Remove Button */}
              <button
                onClick={() => removeImage(image.id)}
                className="absolute top-2 right-2 p-1.5 bg-red-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200 hover:bg-red-700"
                title="Remove image"
              >
                <X size={14} />
              </button>

              {/* Image Info */}
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-2">
                <p className="text-xs text-white truncate">{image.name}</p>
                <p className="text-xs text-gray-300">
                  {(image.size / 1024).toFixed(1)} KB
                </p>
              </div>

              {/* Success Indicator */}
              <div className="absolute top-2 left-2 p-1.5 bg-green-600 text-white rounded-full">
                <Check size={14} />
              </div>
            </div>
          ))}

          {/* Upload More Button */}
          {images.length < maxImages && (
            <div className="aspect-square">
              <button
                onClick={triggerFileInput}
                disabled={uploading}
                className="w-full h-full border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg hover:border-gray-400 dark:hover:border-gray-500 transition-colors flex flex-col items-center justify-center space-y-2"
              >
                <Upload size={24} className="text-gray-400 dark:text-gray-500" />
                <span className="text-sm text-gray-500 dark:text-gray-400">Add More</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* Upload Progress */}
      {uploading && (
        <div className="flex items-center space-x-2 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
          <p className="text-sm text-blue-600 dark:text-blue-400">Processing images...</p>
        </div>
      )}
    </div>
  )
}

export default ImageUpload
