export const MAX_FILE_SIZE_BYTES = 50 * 1024 * 1024

export interface RejectedFile {
  name: string
  reason: 'not-pdf' | 'too-large'
}

function isPdf(file: File): boolean {
  return file.type === 'application/pdf' || /\.pdf$/i.test(file.name)
}

export function partitionUploadFiles(files: readonly File[]): {
  accepted: File[]
  rejected: RejectedFile[]
} {
  const accepted: File[] = []
  const rejected: RejectedFile[] = []
  for (const file of files) {
    if (!isPdf(file)) rejected.push({ name: file.name, reason: 'not-pdf' })
    else if (file.size > MAX_FILE_SIZE_BYTES) rejected.push({ name: file.name, reason: 'too-large' })
    else accepted.push(file)
  }
  return { accepted, rejected }
}

export function describeRejection(rejectedFile: RejectedFile): string {
  switch (rejectedFile.reason) {
    case 'not-pdf':
      return `${rejectedFile.name}: only PDF files are supported`
    case 'too-large':
      return `${rejectedFile.name}: file is larger than 50 MB`
  }
}
