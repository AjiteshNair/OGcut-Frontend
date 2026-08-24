'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'

export default function TestPage() {
  const [bucketName, setBucketName] = useState('shirt-designs')
  const [filePath, setFilePath] = useState('')
  const [signedUrl, setSignedUrl] = useState<string | null>(null)
  const [publicUrl, setPublicUrl] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const supabase = createClient()

  // 1. Handle File Upload
  async function handleFileUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (!file) return

    setUploading(true)
    setError(null)
    setSuccess(null)

    const path = `test-uploads/${Date.now()}-${file.name}`

    const { data, error } = await supabase.storage
      .from(bucketName)
      .upload(path, file)

    setUploading(false)

    if (error) {
      setError(`Upload error: ${error.message}`)
    } else if (data) {
      setFilePath(data.path)
      setSuccess(`File uploaded successfully to: ${data.path}`)
    }
  }

  // 2. Load Signed & Public URLs whenever filePath or bucketName changes
  useEffect(() => {
    if (!filePath) return

    async function fetchImageUrls() {
      setError(null)

      // Get Public URL
      const { data: publicData } = supabase.storage
        .from(bucketName)
        .getPublicUrl(filePath)

      if (publicData?.publicUrl) {
        setPublicUrl(publicData.publicUrl)
      }

      // Get Signed URL (Valid for 60 seconds)
      const { data: signedData, error: signedError } = await supabase.storage
        .from(bucketName)
        .createSignedUrl(filePath, 60)

      if (signedError) {
        setError(`Signed URL error: ${signedError.message}`)
      } else if (signedData) {
        setSignedUrl(signedData.signedUrl)
      }
    }

    fetchImageUrls()
  }, [filePath, bucketName, supabase])

  return (
    <div style={{ maxWidth: '600px', margin: '40px auto', padding: '20px', fontFamily: 'sans-serif' }}>
      <h1>Supabase Storage Test</h1>

      {/* Bucket Input */}
      <div style={{ marginBottom: '20px' }}>
        <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>Bucket Name:</label>
        <input
          type="text"
          value={bucketName}
          onChange={(e) => setBucketName(e.target.value)}
          style={{ width: '100%', padding: '8px' }}
        />
      </div>

      {/* Upload Section */}
      <div style={{ marginBottom: '20px', padding: '15px', border: '1px solid #ccc', borderRadius: '8px' }}>
        <h3>Upload File</h3>
        <input
          type="file"
          accept="image/*"
          onChange={handleFileUpload}
          disabled={uploading}
        />
        {uploading && <p>Uploading...</p>}
      </div>

      {/* File Path Input */}
      <div style={{ marginBottom: '20px' }}>
        <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
          File Path (e.g., test-uploads/image.png):
        </label>
        <input
          type="text"
          value={filePath}
          onChange={(e) => setFilePath(e.target.value)}
          placeholder="Enter existing image path..."
          style={{ width: '100%', padding: '8px' }}
        />
      </div>

      {/* Status Messages */}
      {error && <div style={{ color: 'red', marginBottom: '15px' }}>{error}</div>}
      {success && <div style={{ color: 'green', marginBottom: '15px' }}>{success}</div>}

      {/* Previews */}
      {filePath && (
        <div style={{ display: 'grid', gap: '20px', marginTop: '20px' }}>
          {publicUrl && (
            <div style={{ border: '1px solid #eee', padding: '10px', borderRadius: '8px' }}>
              <h4>Public URL Preview</h4>
              <img src={publicUrl} alt="Public Preview" style={{ maxWidth: '100%', height: 'auto' }} />
            </div>
          )}

          {signedUrl && (
            <div style={{ border: '1px solid #eee', padding: '10px', borderRadius: '8px' }}>
              <h4>Signed URL Preview (Private)</h4>
              <img src={signedUrl} alt="Signed Preview" style={{ maxWidth: '100%', height: 'auto' }} />
            </div>
          )}
        </div>
      )}
    </div>
  )
}