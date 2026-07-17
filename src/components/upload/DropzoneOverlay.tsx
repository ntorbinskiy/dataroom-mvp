import { useRef, useState } from 'react'

export function DropzoneOverlay({
  onFiles,
  children,
}: {
  onFiles: (files: File[]) => void
  children: React.ReactNode
}) {
  const [active, setActive] = useState(false)
  const depth = useRef(0)
  return (
    <div
      className="relative min-h-[60vh]"
      onDragEnter={(event) => {
        event.preventDefault()
        depth.current += 1
        if (event.dataTransfer.types.includes('Files')) setActive(true)
      }}
      onDragOver={(event) => event.preventDefault()}
      onDragLeave={() => {
        depth.current -= 1
        if (depth.current <= 0) {
          depth.current = 0
          setActive(false)
        }
      }}
      onDrop={(event) => {
        event.preventDefault()
        depth.current = 0
        setActive(false)
        const files = Array.from(event.dataTransfer.files)
        if (files.length > 0) onFiles(files)
      }}
    >
      {children}
      {active ? (
        <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center rounded-lg border-2 border-dashed border-primary bg-primary/5">
          <p className="rounded-md bg-card px-4 py-2 text-sm font-medium text-primary shadow-sm">
            Drop PDF files to upload
          </p>
        </div>
      ) : null}
    </div>
  )
}
