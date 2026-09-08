'use client';
import { useState, useEffect, useRef } from 'react';
import type { MuseumController } from '@/lib/museum-engine';
import { ArrowUpRight, Layers3, Maximize, RotateCcw, Play, Pause, Footprints, ArrowUp, ArrowDown, ArrowLeft, ArrowRight, Sun, Moon } from 'lucide-react';
import { Button } from '@/components/ui/button';
const galleries = [
 {id:'01',name:'方炮塔坦克',theme:'历史花园',image:'heritage',color:'#c8b47e'},
 {id:'02',name:'Challenger 2',theme:'荒漠巡游',image:'desert',color:'#d9ac74'},
 {id:'03',name:'Leopard 2 A7',theme:'蓝色展馆',image:'leopard',color:'#8ab7ce'},
 {id:'04',name:'T-90MS',theme:'泥地试验场',image:'t90',color:'#afbc88'},
 {id:'05',name:'Abrams X',theme:'未来科技厅',image:'tech',color:'#83cfea'},
];
export default function Home(){
 const [selected,setSelected]=useState(-1);
 const [night,setNight]=useState(false);
 const gallery=galleries[selected];
 const stage=useRef<HTMLDivElement>(null),engine=useRef<MuseumController|null>(null);
 const [ready,setReady]=useState(false),[progress,setProgress]=useState(0),[error,setError]=useState(false),[attempt,setAttempt]=useState(0),[mode,setMode]=useState<'orbit'|'walk'|'tour'>('orbit');
 useEffect(()=>{const abort=new AbortController();setError(false);setReady(false);setProgress(0);
  import('@/lib/museum-engine').then(({createMuseum})=>{if(!abort.signal.aborted&&stage.current)return createMuseum(stage.current,{progress:setProgress,ready:()=>setReady(true),error:()=>{setError(true);setReady(false)},selection:setSelected,mode:setMode},abort.signal)}).then(c=>{if(c&&!abort.signal.aborted){engine.current=c;c.night(night)}}).catch(()=>setError(true));
  return ()=>{abort.abort();engine.current=null};
 },[attempt]);
 const choose=(i:number)=>{setSelected(i);engine.current?.view(i)};
 const fullscreen=()=>{if(document.fullscreenElement)document.exitFullscreen?.().catch(()=>{});else document.documentElement.requestFullscreen?.().catch(()=>{})};
 return <main className="museum-shell" data-time={night?'night':'day'}>
  <header className="masthead"><div className="brand"><Layers3 size={25}/><div><span className="eyebrow">THE MINIATURE COLLECTION</span><h1>微缩坦克博物馆<span> / 05</span></h1></div></div><div className="header-meta"><span className="live-dot"/>五个场景 · 一座博物馆</div></header>
  <section className="museum-stage" aria-label="坦克博物馆三维展览"><img className="museum-poster" src={'/museum/'+(ready?'overview':gallery?.image||'overview')+'.png'} alt={gallery?gallery.name+'主题展区':'五台坦克及独立场景的博物馆总览'}/>
   <div className="webgl-surface" ref={stage} style={{opacity:ready?1:0}}/><div className="view-caption"><span className="eyebrow">{gallery?'GALLERY '+gallery.id:'MUSEUM OVERVIEW'}</span><h2>{gallery?.theme||'把世界，收藏在这里。'}</h2><p>{gallery?.name||'沿着中央步道，探索五个微缩世界。'}</p></div>
   <div className="view-toolbar"><Button className="tool-button" disabled={!ready} aria-pressed={night} onClick={()=>{const next=!night;setNight(next);engine.current?.night(next)}}>{night?<Sun/>:<Moon/>}{night?'切换白天':'切换夜间'}</Button><Button className="tool-button" onClick={()=>choose(-1)}><RotateCcw/>全馆视角</Button><Button className="tool-button" disabled={!ready} onClick={()=>engine.current?.tour(mode!=='tour')}>{mode==='tour'?<Pause/>:<Play/>}{mode==='tour'?'暂停导览':'自动导览'}</Button><Button className="tool-button" disabled={!ready} onClick={()=>engine.current?.walk()} aria-pressed={mode==='walk'}><Footprints/>步入馆内</Button><Button className="tool-button" onClick={fullscreen} aria-label="全屏查看"><Maximize/></Button></div>
   <div className="stage-note">{ready?(mode==='walk'?'拖动转向 · WASD / 箭头移动 · Esc 退出':mode==='tour'?'60 秒导览 · 沿中央步道参观五个展区':<><span className="desktop-hint">拖动旋转 · 滚轮缩放 · 点击坦克走近观看</span><span className="mobile-hint">单指旋转 · 双指缩放</span></>):'原作视角 · 五座独立主题展区'}</div>
   {!ready&&<div className="loading-status" role="status">{error?<><span>三维场景未能加载 </span><button onClick={()=>setAttempt(n=>n+1)}>重新加载 ↗</button></>:`正在打开博物馆 ${progress}%`}</div>}
   {mode==='walk'&&<div className="walk-pad" aria-label="行走方向"><Button aria-label="向左走" onClick={()=>engine.current?.step('a')}><ArrowLeft/></Button><div><Button aria-label="向前走" onClick={()=>engine.current?.step('w')}><ArrowUp/></Button><Button aria-label="向后走" onClick={()=>engine.current?.step('s')}><ArrowDown/></Button></div><Button aria-label="向右走" onClick={()=>engine.current?.step('d')}><ArrowRight/></Button></div>}
  </section>
  <nav className="gallery-dock" aria-label="选择展区"><div className="dock-intro"><span className="eyebrow">EXPLORE THE GALLERIES</span><strong>选择你的下一站 <ArrowUpRight size={17}/></strong></div><div className="gallery-list">{galleries.map((g,i)=><Button key={g.id} className={'gallery-button '+(selected===i?'selected':'')} style={{'--gallery-color':g.color} as React.CSSProperties} onClick={()=>choose(i)} aria-pressed={selected===i}><span className="gallery-index">{g.id}</span><span className="gallery-copy"><b>{g.name}</b><span>{g.theme}</span></span></Button>)}</div></nav>
 </main>
}
