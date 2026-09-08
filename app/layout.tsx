import type { Metadata } from 'next';
import './globals.css';
export const metadata: Metadata={title:'微缩坦克博物馆 · The Miniature Collection',description:'走进五座主题展区，探索保留原作视角与柔和光照的微缩坦克博物馆。'};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="zh-CN"><body>{children}</body></html>}
