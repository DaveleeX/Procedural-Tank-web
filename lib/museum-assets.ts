/** Production loads museum binaries from GitHub via jsDelivr so Vercel can build the app without uploading 70MB of glTF assets. */
export const museumPublic = import.meta.env.PROD
  ? 'https://cdn.jsdelivr.net/gh/DaveleeX/tank-museum@main/public'
  : '';

export function museumAsset(path: string): string {
  const normalized = path.startsWith('/') ? path : `/${path}`;
  return `${museumPublic}${normalized}`;
}
