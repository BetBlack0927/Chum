'use client'

import { useRef, useState, useTransition } from 'react'
import { createClient } from '@/lib/supabase/client'
import { updateAvatarUrl } from '@/lib/actions/profile'
import { getInitials, getAvatarColor } from '@/lib/utils'
import { Camera, Loader2, X } from 'lucide-react'

interface AvatarUploadProps {
  userId:       string
  username:     string
  avatarColor:  string
  avatarUrl:    string | null
}

const MAX_BYTES = 5 * 1024 * 1024 // 5 MB

export function AvatarUpload({ userId, username, avatarColor, avatarUrl }: AvatarUploadProps) {
  const inputRef              = useRef<HTMLInputElement>(null)
  const [preview, setPreview] = useState<string | null>(avatarUrl)
  const [error,   setError]   = useState<string | null>(null)
  const [isPending, start]    = useTransition()

  const color = avatarColor || getAvatarColor(userId)

  async function handleFile(file: File) {
    setError(null)

    if (!file.type.startsWith('image/')) {
      setError('Please choose a JPG, PNG, or WebP image.')
      return
    }
    if (file.size > MAX_BYTES) {
      setError('Image must be under 5 MB.')
      return
    }

    // Show local preview immediately
    const localUrl = URL.createObjectURL(file)
    setPreview(localUrl)

    start(async () => {
      const supabase = createClient()

      // Upload to Supabase Storage: avatars/{userId}/{timestamp}.ext
      const ext  = file.name.split('.').pop() ?? 'jpg'
      const path = `${userId}/${Date.now()}.${ext}`

      const { data, error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(path, file, { upsert: true, contentType: file.type })

      if (uploadError || !data) {
        setError(uploadError?.message ?? 'Upload failed.')
        setPreview(avatarUrl) // revert preview
        return
      }

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(data.path)

      const result = await updateAvatarUrl(publicUrl)
      if (result?.error) {
        setError(result.error)
        setPreview(avatarUrl)
      } else {
        setPreview(publicUrl)
      }
    })
  }

  async function handleRemove() {
    setError(null)
    setPreview(null)
    start(async () => {
      await updateAvatarUrl(null)
    })
  }

  return (
    <div className="flex flex-col items-center gap-3">
      {/* Avatar with edit overlay */}
      <div className="relative group">
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={isPending}
          className="relative w-24 h-24 rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-brand"
          aria-label="Change profile picture"
        >
          {/* Image or initials */}
          {preview ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={preview}
              alt={username}
              className="w-24 h-24 rounded-full object-cover"
            />
          ) : (
            <div
              className="w-24 h-24 rounded-full flex items-center justify-center text-2xl font-black text-white select-none"
              style={{ backgroundColor: color }}
            >
              {getInitials(username)}
            </div>
          )}

          {/* Hover / loading overlay */}
          <div className={`absolute inset-0 rounded-full flex items-center justify-center transition-opacity bg-black/50 ${isPending ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
            {isPending
              ? <Loader2 size={22} className="text-white animate-spin" />
              : <Camera size={22} className="text-white" />
            }
          </div>
        </button>

        {/* Remove button (only when there's a photo) */}
        {preview && !isPending && (
          <button
            type="button"
            onClick={handleRemove}
            className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-surface-2 border border-white/15 flex items-center justify-center text-white/60 hover:text-white hover:bg-red-500/80 transition-colors"
            aria-label="Remove profile picture"
          >
            <X size={12} />
          </button>
        )}
      </div>

      {/* Tap hint */}
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={isPending}
        className="text-xs text-brand-light/70 hover:text-brand-light transition-colors font-medium"
      >
        {preview ? 'Change photo' : 'Add profile photo'}
      </button>

      {/* Error */}
      {error && (
        <p className="text-xs text-red-400 text-center max-w-[200px]">{error}</p>
      )}

      {/* Hidden file input */}
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="sr-only"
        onChange={(e) => {
          const file = e.target.files?.[0]
          if (file) handleFile(file)
          e.target.value = '' // allow re-selecting same file
        }}
      />
    </div>
  )
}
