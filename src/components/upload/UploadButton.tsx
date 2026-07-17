import { useRef } from 'react'
import { Upload } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function UploadButton({
  pending,
  onFiles,
}: {
  pending: boolean
  onFiles: (files: File[]) => void
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept="application/pdf,.pdf"
        multiple
        className="hidden"
        onChange={(event) => {
          const files = Array.from(event.target.files ?? [])
          if (files.length > 0) onFiles(files)
          event.target.value = ''
        }}
      />
      <Button disabled={pending} onClick={() => inputRef.current?.click()}>
        <Upload className="h-4 w-4" /> {pending ? 'Uploading…' : 'Upload PDF'}
      </Button>
    </>
  )
}
