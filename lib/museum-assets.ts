/** Production loads museum binaries from GitHub so Vercel can build without uploading 70MB of glTF assets. */
export const museumPublic = import.meta.env.PROD
  ? 'https://raw.githubusercontent.com/DaveleeX/tank-museum/main/public'
  : '';

export function museumAsset(path: string): string {
  const normalized = path.startsWith('/') ? path : `/${path}`;
  return `${museumPublic}${normalized}`;
}
