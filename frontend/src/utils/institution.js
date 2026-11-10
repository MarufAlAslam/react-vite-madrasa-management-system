export const DEFAULT_MADRASA_NAME = "Moulovir Hat Hosainia Kamil(Master's) Madrasah"

// The madrasa name set under Settings, falling back to the original name until one is saved.
export function getMadrasaName(settings) {
  return settings?.madrasaName?.trim() || DEFAULT_MADRASA_NAME
}
