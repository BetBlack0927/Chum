'use client'

import { useRef, useState, useTransition } from 'react'
import { createClient } from '@/lib/supabase/client'
import { updateGroupAvatarUrl } from '@/lib/actions/groups'
import { Camera, Loader2, X } from 'lucide-react'

interface GroupAvatarUploadProps {
  groupId:    string
  groupName:  string
  avatarUrl:  string | null
}

const MAX_BYTES = 5 * 1024 * 1024 // 5 MB

export function GroupAvatarUpload({ groupId, groupName, avatarUrl }: GroupAvatarUploadProps) {
  const inputRef              = useRef<HTMLInputElement>(null)
  const [preview, setPreview] = useState<string | null>(avatarUrl)
  const [error,   setError]   = useState<string | null>(null)
  const [isPending, start]    = useTransition()

  const initial = groupName.charAt(0).toUpperCase()

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

    // Instant local preview
    setPreview(URL.createObjectURL(file))

    start(async () => {
      const supabase = createClient()

      const ext  = file.name.split('.').pop() ?? 'jpg'
      const path = `${groupId}/${Date.now()}.${ext}`

      const { data, error: uploadError } = await supabase.storage
        .from('group-avatars')
        .upload(path, file, { upsert: true, contentType: file.type })

      if (uploadError || !data) {
        setError(uploadError?.message ?? 'Upload failed.')
        setPreview(avatarUrl)
        return
      }

      const { data: { publicUrl } } = supabase.storage
        .from('group-avatars')
        .getPublicUrl(data.path)

      const result = await updateGroupAvatarUrl(groupId, publicUrl)
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
      await updateGroupAvatarUrl(groupId, null)
    })
  }

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative group">
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={isPending}
          className="relative w-24 h-24 rounded-2xl focus:outline-none focus-visible:ring-2 focus-visible:ring-brand"
          aria-label="Change group photo"
        >
          {preview ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={preview}
              alt={groupName}
              className="w-24 h-24 rounded-2xl object-cover"
            />
          ) : (
            <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-brand/30 to-gold/20 border border-white/10 flex items-center justify-center text-3xl font-black text-white select-none">
              {initial}
            </div>
          )}

          {/* Hover / loading overlay */}
          <div className={`absolute inset-0 rounded-2xl flex items-center justify-center transition-opacity bg-black/50 ${isPending ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
            {isPending
              ? <Loader2 size={22} className="text-white animate-spin" />
              : <Camera size={22} className="text-white" />
            }
          </div>
        </button>

        {/* Remove button */}
        {preview && !isPending && (
          <button
            type="button"
            onClick={handleRemove}
            className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-surface-2 border border-white/15 flex items-center justify-center text-white/60 hover:text-white hover:bg-red-500/80 transition-colors"
            aria-label="Remove group photo"
          >
            <X size={12} />
          </button>
        )}
      </div>

      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={isPending}
        className="text-xs text-brand-light/70 hover:text-brand-light transition-colors font-medium"
      >
        {preview ? 'Change group photo' : 'Add group photo'}
      </button>

      {error && (
        <p className="text-xs text-red-400 text-center max-w-[220px]">{error}</p>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="sr-only"
        onChange={(e) => {
          const file = e.target.files?.[0]
          if (file) handleFile(file)
          e.target.value = ''
        }}
      />
    </div>
  )
}
