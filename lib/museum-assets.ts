/** Keep museum assets same-origin so the 3D scene does not depend on GitHub raw CDN. */
export const museumPublic = '';

export function museumAsset(path: string): string {
  const normalized = path.startsWith('/') ? path : `/${path}`;
  return `${museumPublic}${normalized}`;
}
