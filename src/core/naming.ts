export const MAX_NAME_LENGTH = 255

export type NameValidation = { ok: true; name: string } | { ok: false; error: string }

export function validateName(raw: string): NameValidation {
  const name = raw.trim()
  if (name.length === 0) return { ok: false, error: 'Name cannot be empty' }
  if (name.length > MAX_NAME_LENGTH) {
    return { ok: false, error: `Name is too long (${MAX_NAME_LENGTH} characters max)` }
  }
  return { ok: true, name }
}

export function splitPdfName(fileName: string): { base: string; extension: string } {
  const match = /^(.+)(\.pdf)$/i.exec(fileName)
  const base = match?.[1]
  const extension = match?.[2]
  if (base !== undefined && extension !== undefined) return { base, extension }
  return { base: fileName, extension: '' }
}

export function isNameTaken(name: string, takenNames: readonly string[]): boolean {
  const lower = name.toLowerCase()
  return takenNames.some((taken) => taken.toLowerCase() === lower)
}

export function resolveUniqueName(desired: string, takenNames: readonly string[]): string {
  if (!isNameTaken(desired, takenNames)) return desired
  const { base, extension } = splitPdfName(desired)
  for (let i = 1; ; i += 1) {
    const candidate = `${base} (${i})${extension}`
    if (!isNameTaken(candidate, takenNames)) return candidate
  }
}
