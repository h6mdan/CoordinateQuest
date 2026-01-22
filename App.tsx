
import React, { useState, useRef, useMemo } from 'react';

interface Block {
  id: string;
  type: 'motion' | 'glide' | 'say';
  label: string;
  x?: number | null;
  y?: number | null;
  text?: string;
  duration?: number;
}

interface Sprite {
  id: string;
  x: number;
  y: number;
  type: string;
  saying?: string | null;
}

interface ThemeConfig {
  id: number;
  title: string;
  icon: string;
  goal: string;
  bgClass: string;
  accentColor: string;
  blockColors: { motion: string; glide: string; say: string };
  targetEmoji: string;
  initialSprite: string;
  uiStyle: string;
}

const THEMES: ThemeConfig[] = [
  { 
    id: 1, title: "Dance Party", icon: "fa-music", goal: "Make the cat dance to the music note!", 
    bgClass: "bg-purple-50", accentColor: "purple",
    blockColors: { motion: "bg-pink-500", glide: "bg-fuchsia-600", say: "bg-violet-500" },
    targetEmoji: "🎵", initialSprite: "🐱", uiStyle: "dance-style"
  },
  { 
    id: 2, title: "Interactive Story", icon: "fa-book-open", goal: "Introduce yourself to the dragon!", 
    bgClass: "bg-orange-50", accentColor: "orange",
    blockColors: { motion: "bg-amber-600", glide: "bg-orange-700", say: "bg-yellow-600" },
    targetEmoji: "🐲", initialSprite: "👧", uiStyle: "story-style"
  },
  { 
    id: 3, title: "Bouncer", icon: "fa-basketball", goal: "Glide to the hoop to score points!", 
    bgClass: "bg-blue-50", accentColor: "blue",
    blockColors: { motion: "bg-blue-500", glide: "bg-sky-600", say: "bg-cyan-500" },
    targetEmoji: "🏀", initialSprite: "⛹️", uiStyle: "bouncer-style"
  },
  { 
    id: 4, title: "Collector", icon: "fa-gem", goal: "Collect all the hidden gems!", 
    bgClass: "bg-emerald-50", accentColor: "emerald",
    blockColors: { motion: "bg-emerald-500", glide: "bg-teal-600", say: "bg-green-500" },
    targetEmoji: "💎", initialSprite: "🦊", uiStyle: "collector-style"
  },
  { 
    id: 5, title: "Space Maze", icon: "fa-rocket", goal: "Navigate the rocket to the star!", 
    bgClass: "bg-slate-950", accentColor: "indigo",
    blockColors: { motion: "bg-indigo-600", glide: "bg-blue-800", say: "bg-slate-700" },
    targetEmoji: "🌟", initialSprite: "🚀", uiStyle: "space-style"
  },
  { 
    id: 6, title: "Showcase", icon: "fa-palette", goal: "Create your own creative sequence!", 
    bgClass: "bg-rose-50", accentColor: "rose",
    blockColors: { motion: "bg-rose-500", glide: "bg-pink-600", say: "bg-red-500" },
    targetEmoji: "🎨", initialSprite: "🦄", uiStyle: "creative-style"
  },
];

const ALL_AVAILABLE_SPRITES = ['🐱', '🐶', '🦄', '🦖', '🤖', '🦊', '🐼', '🦁', '🚀', '⛹️', '👧', '🎨'];
const POINTS_PER_UNLOCK = 3;
const INITIAL_UNLOCKED = 3;

export default function App() {
  const [gameState, setGameState] = useState<'MENU' | 'PLAYING'>('MENU');
  const [activeTheme, setActiveTheme] = useState<ThemeConfig>(THEMES[0]);
  const [sprites, setSprites] = useState<Sprite[]>([
    { id: 'sprite-1', x: 0, y: 0, type: THEMES[0].initialSprite, saying: null }
  ]);
  const [activeSpriteId, setActiveSpriteId] = useState<string>('sprite-1');
  const [stack, setStack] = useState<Block[]>([]);
  const [targetPos, setTargetPos] = useState({ x: 150, y: 100 });
  const [score, setScore] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [collisionMessage, setCollisionMessage] = useState<string | null>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [unlockMessage, setUnlockMessage] = useState<string | null>(null);
  const [hoveredSprite, setHoveredSprite] = useState<number | null>(null);
  
  const isRunningRef = useRef(false);

  const activeSprite = sprites.find(s => s.id === activeSpriteId);
  const unlockedCount = Math.min(ALL_AVAILABLE_SPRITES.length, INITIAL_UNLOCKED + Math.floor(score / POINTS_PER_UNLOCK));
  const currentProgress = score % POINTS_PER_UNLOCK;

  const selectTheme = (theme: ThemeConfig) => {
    setActiveTheme(theme);
    const newId = `sprite-${Date.now()}`;
    setSprites([{ id: newId, x: 0, y: 0, type: theme.initialSprite, saying: null }]);
    setActiveSpriteId(newId);
    setStack([]);
    setCollisionMessage(null);
    setIsMenuOpen(false);
  };

  const runScript = async () => {
    if (stack.length === 0 || isRunning) return;
    setIsRunning(true);
    isRunningRef.current = true;
    for (let i = 0; i < stack.length; i++) {
      if (!isRunningRef.current) break;
      const block = stack[i];
      if (block.type === 'motion' || block.type === 'glide') {
        const targetX = block.x ?? 0;
        const targetY = block.y ?? 0;
        const duration = block.type === 'glide' ? 1500 : 600;
        setSprites(prev => prev.map(s => s.id === activeSpriteId ? { ...s, x: targetX, y: targetY } : s));
        await new Promise(resolve => setTimeout(resolve, duration));
        if (!isRunningRef.current) break;
        const dist = Math.sqrt(Math.pow(targetX - targetPos.x, 2) + Math.pow(targetY - targetPos.y, 2));
        if (dist < 50) {
          const oldUnlocked = Math.floor(score / POINTS_PER_UNLOCK);
          const newScore = score + 1;
          const newUnlocked = Math.floor(newScore / POINTS_PER_UNLOCK);
          setScore(newScore);
          setCollisionMessage("EXCELLENT! 🎉");
          if (newUnlocked > oldUnlocked && (unlockedCount < ALL_AVAILABLE_SPRITES.length)) {
            setUnlockMessage("NEW CHARACTER UNLOCKED! 🌟");
            setTimeout(() => setUnlockMessage(null), 3000);
          }
          setTargetPos({ x: Math.floor(Math.random() * 300 - 150), y: Math.floor(Math.random() * 200 - 100) });
          setTimeout(() => setCollisionMessage(null), 2000);
        }
      } else if (block.type === 'say') {
        setSprites(prev => prev.map(s => s.id === activeSpriteId ? { ...s, saying: block.text || "Hello!" } : s));
        await new Promise(resolve => setTimeout(resolve, (block.duration || 2) * 1000));
        setSprites(prev => prev.map(s => s.id === activeSpriteId ? { ...s, saying: null } : s));
      }
    }
    setIsRunning(false);
    isRunningRef.current = false;
  };

  const stopScript = () => {
    setIsRunning(false);
    isRunningRef.current = false;
    setCollisionMessage(null);
    setSprites(prev => prev.map(s => ({ ...s, saying: null })));
  };

  const resetAll = () => {
    stopScript();
    setSprites(prev => prev.map(s => ({ ...s, x: 0, y: 0, saying: null })));
    setScore(0);
  };

  const addBlockToStack = (type: 'motion' | 'glide' | 'say') => {
    const newBlock: Block = {
      id: Math.random().toString(36).substr(2, 9),
      type,
      label: type === 'motion' ? 'go to' : type === 'glide' ? 'glide to' : 'say',
      x: (type === 'motion' || type === 'glide') ? null : undefined,
      y: (type === 'motion' || type === 'glide') ? null : undefined,
      text: type === 'say' ? 'Hello!' : undefined,
      duration: type === 'say' ? 2 : undefined
    };
    setStack([...stack, newBlock]);
  };

  const updateBlockValue = (id: string, field: keyof Block, value: any) => {
    setStack(prevStack => prevStack.map(b => {
      if (b.id !== id) return b;
      if (field === 'x' || field === 'y' || field === 'duration') {
        const val = value === '' ? null : parseInt(value);
        return { ...b, [field]: isNaN(val as any) ? null : val };
      }
      return { ...b, [field]: value };
    }));
  };

  const removeBlock = (id: string) => setStack(stack.filter(b => b.id !== id));

  const deleteSprite = (id: string) => {
    if (sprites.length <= 1) return;
    const newSprites = sprites.filter(s => s.id !== id);
    setSprites(newSprites);
    if (activeSpriteId === id) setActiveSpriteId(newSprites[0].id);
  };

  const addNewSprite = (type: string, isLocked: boolean, idx: number) => {
    if (isLocked) {
      const pointsNeeded = (idx - INITIAL_UNLOCKED + 1) * POINTS_PER_UNLOCK - score;
      setCollisionMessage(`Score ${pointsNeeded} more points!`);
      setTimeout(() => setCollisionMessage(null), 3000);
      return;
    }
    const id = `sprite-${Date.now()}`;
    setSprites([...sprites, { id, x: 0, y: 0, type, saying: null }]);
    setActiveSpriteId(id);
  };

  const xLabels = useMemo(() => {
    const labels = [];
    for (let i = -1000; i <= 1000; i += 50) { if (i !== 0) labels.push(i); }
    return labels;
  }, []);

  const yLabels = useMemo(() => {
    const labels = [];
    for (let i = -800; i <= 800; i += 50) { if (i !== 0) labels.push(i); }
    return labels;
  }, []);

  const ui = useMemo(() => {
    switch(activeTheme.uiStyle) {
      case 'space-style': return { panel: 'bg-slate-900/80 border-indigo-500/30 text-indigo-100', input: 'bg-indigo-950/50 border-indigo-400/30' };
      case 'dance-style': return { panel: 'bg-fuchsia-50/90 border-fuchsia-200 text-fuchsia-900', input: 'bg-white/50 border-fuchsia-300' };
      case 'story-style': return { panel: 'bg-orange-50/90 border-orange-200 text-orange-900', input: 'bg-white/80 border-orange-300' };
      default: return { panel: 'glass border-white/60 text-slate-800', input: 'bg-white/20 border-white/30' };
    }
  }, [activeTheme]);

  if (gameState === 'MENU') {
    return (
      <div className="h-screen w-full flex flex-col items-center justify-center relative overflow-hidden">
        
        {/* Playful Floating Decorations */}
        <div className="absolute top-[10%] left-[5%] text-6xl opacity-20 animate-float pointer-events-none">⭐</div>
        <div className="absolute top-[20%] right-[10%] text-6xl opacity-20 animate-float pointer-events-none" style={{ animationDelay: '1s' }}>🎨</div>
        <div className="absolute bottom-[15%] left-[15%] text-6xl opacity-20 animate-float pointer-events-none" style={{ animationDelay: '2s' }}>🎮</div>
        <div className="absolute bottom-[25%] right-[5%] text-6xl opacity-20 animate-float pointer-events-none" style={{ animationDelay: '1.5s' }}>🧩</div>

        {/* LOGO IN TOP LEFT CORNER */}
        <div className="absolute top-8 left-8 z-50 animate-bounce-in">
  <svg 
    viewBox="0 0 1000 1000" 
    className="h-16 md:h-20 w-auto drop-shadow-xl transform transition-transform hover:scale-110 active:rotate-12 cursor-pointer"
    xmlns="http://www.w3.org/2000/svg"
  >
    {/* Orange coding person icon */}
    <circle cx="500" cy="150" r="80" fill="#FF9800"/>
    <path d="M 300 300 L 420 450 L 300 600 L 350 650 L 500 500 L 350 350 Z" fill="#FF9800"/>
    <path d="M 700 300 L 580 450 L 700 600 L 650 650 L 500 500 L 650 350 Z" fill="#FF9800"/>
    
    {/* MILLION text */}
    <text x="50" y="800" fontSize="180" fontWeight="900" fill="#000000" fontFamily="Arial, sans-serif">MILLION</text>
    
    {/* CODERS text with orange bars */}
    <text x="50" y="970" fontSize="180" fontWeight="900" fill="#000000" fontFamily="Arial, sans-serif">COD</text>
    <rect x="480" y="800" width="40" height="150" fill="#FF9800"/>
    <text x="530" y="970" fontSize="180" fontWeight="900" fill="#000000" fontFamily="Arial, sans-serif">RS</text>
  </svg>
</div>

        {/* Background Gradients */}
        <div className="absolute top-[-25%] right-[-15%] w-[70%] h-[70%] rounded-full bg-blue-100/50 blur-[120px] animate-pulse"></div>
        <div className="absolute bottom-[-25%] left-[-15%] w-[70%] h-[70%] rounded-full bg-pink-100/50 blur-[120px] animate-pulse" style={{animationDelay: '3s'}}></div>

        <div className="z-20 flex flex-col items-center w-full max-w-5xl px-8">
          
          {/* Characters Preview */}
          <div className="flex gap-8 mb-8 animate-in slide-in-from-top-20 duration-1000">
            <div className="text-7xl animate-wiggle" style={{ animationDelay: '0s' }}>🐱</div>
            <div className="text-7xl animate-wiggle" style={{ animationDelay: '0.3s' }}>🦄</div>
            <div className="text-7xl animate-wiggle" style={{ animationDelay: '0.6s' }}>🚀</div>
            <div className="text-7xl animate-wiggle" style={{ animationDelay: '0.9s' }}>🦖</div>
          </div>

          {/* Main Title section */}
          <div className="text-center mb-12 space-y-4 relative">
            <div className="absolute -top-10 -left-10 text-4xl animate-bounce">🎈</div>
            <h1 className="text-7xl md:text-9xl font-black text-slate-800 tracking-tight leading-none select-none filter drop-shadow-[0_10px_0_rgba(0,0,0,0.1)]">
              Coordinate<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 via-pink-500 to-indigo-600 animate-pulse">QUEST!</span>
            </h1>
            <div className="absolute -bottom-5 -right-10 text-4xl animate-bounce" style={{ animationDelay: '1s' }}>🍭</div>
          </div>

          {/* Play Dashboard Card */}
          <div className="w-full max-w-3xl bg-white/60 backdrop-blur-2xl p-8 rounded-[4rem] shadow-[0_30px_60px_-15px_rgba(0,0,0,0.1)] border-4 border-white flex flex-col items-center gap-10">
            
            <div className="flex gap-4 w-full justify-center">
              <div className="bg-gradient-to-br from-yellow-400 to-orange-500 p-6 rounded-[2.5rem] shadow-xl transform -rotate-3 hover:rotate-0 transition-transform flex flex-col items-center w-40 border-4 border-white">
                <i className="fa-solid fa-star text-white text-3xl mb-1 drop-shadow-md"></i>
                <span className="text-[12px] font-black uppercase tracking-widest text-white/80">Your Points</span>
                <span className="text-4xl font-black text-white">{score}</span>
              </div>
              <div className="bg-gradient-to-br from-indigo-500 to-purple-600 p-6 rounded-[2.5rem] shadow-xl transform rotate-3 hover:rotate-0 transition-transform flex flex-col items-center w-40 border-4 border-white">
                <i className="fa-solid fa-ghost text-white text-3xl mb-1 drop-shadow-md"></i>
                <span className="text-[12px] font-black uppercase tracking-widest text-white/80">Friends</span>
                <span className="text-4xl font-black text-white">{unlockedCount}</span>
              </div>
            </div>

            <button 
              onClick={() => setGameState('PLAYING')}
              className="group relative w-full md:w-80 h-24 bg-slate-900 text-white rounded-[2.5rem] font-black text-4xl shadow-[0_15px_35px_rgba(0,0,0,0.2)] hover:bg-slate-800 hover:scale-110 active:scale-95 transition-all flex items-center justify-center gap-4 overflow-hidden animate-wiggle border-b-8 border-slate-950"
            >
              <span className="relative z-10">PLAY NOW!</span>
              <div className="w-12 h-12 bg-orange-500 rounded-full flex items-center justify-center group-hover:rotate-180 transition-transform">
                <i className="fa-solid fa-rocket text-xl"></i>
              </div>
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
            </button>

            <div className="flex flex-wrap justify-center gap-6 text-slate-400 font-bold text-sm tracking-wide">
              <span className="flex items-center gap-2"><i className="fa-solid fa-circle-check text-green-500"></i> Fun Learning</span>
              <span className="flex items-center gap-2"><i className="fa-solid fa-circle-check text-blue-500"></i> Easy Blocks</span>
              <span className="flex items-center gap-2"><i className="fa-solid fa-circle-check text-pink-500"></i> Cool Characters</span>
            </div>
          </div>
        </div>

        {/* Footer Text */}
        <div className="absolute bottom-6 left-0 right-0 text-center opacity-40 text-xs font-black uppercase tracking-[0.4em] select-none text-slate-500">
          Created for Future Coders 🚀 2024
        </div>
      </div>
    );
  }

  return (
    <div className={`h-screen flex flex-col overflow-hidden ${activeTheme.uiStyle === 'space-style' ? 'text-indigo-100' : 'text-slate-800'} transition-all duration-700`}>
      {/* Global Notifications */}
      {unlockMessage && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-[100] bg-gradient-to-r from-amber-400 to-yellow-500 text-white px-8 py-4 rounded-3xl shadow-[0_20px_50px_rgba(245,158,11,0.3)] font-black text-xl animate-bounce border-4 border-white">
          {unlockMessage}
        </div>
      )}

      <header className="h-16 glass mx-4 mt-4 rounded-2xl flex items-center px-6 justify-between shadow-[0_8px_32px_rgba(0,0,0,0.05)] z-40 relative">
        <div className="flex items-center gap-6">
          <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="flex items-center gap-2 group">
            <div className={`w-10 h-10 bg-gradient-to-tr from-${activeTheme.accentColor}-500 to-${activeTheme.accentColor}-700 rounded-xl flex items-center justify-center shadow-lg transform group-hover:rotate-12 transition-transform`}>
              <i className={`fa-solid ${activeTheme.icon} text-white text-xl`}></i>
            </div>
            <div className="text-left">
              <span className="block text-[10px] font-black uppercase opacity-50 tracking-tighter leading-none">Themes</span>
              <span className="font-black text-lg tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-slate-700 to-slate-900">
                {activeTheme.title}
              </span>
            </div>
          </button>
          
          <div className="h-10 w-[1px] bg-slate-200/50 hidden md:block"></div>

          <div className="flex items-center gap-3 bg-white/30 p-1 rounded-full shadow-inner border border-white/40">
            <button onClick={runScript} disabled={isRunning} className={`w-11 h-11 rounded-full flex items-center justify-center transition-all ${isRunning ? 'bg-green-100' : 'bg-green-500 hover:bg-green-400 hover:scale-110 shadow-lg'}`}>
              <i className="fa-solid fa-play text-white"></i>
            </button>
            <button onClick={stopScript} className="w-11 h-11 bg-rose-500 rounded-full flex items-center justify-center hover:bg-rose-400 transition-all shadow-lg">
              <i className="fa-solid fa-stop text-white"></i>
            </button>
            <button onClick={resetAll} className="w-11 h-11 bg-amber-400 rounded-full flex items-center justify-center hover:bg-amber-300 transition-all shadow-lg">
              <i className="fa-solid fa-rotate-left text-white"></i>
            </button>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <button onClick={() => setGameState('MENU')} className="glass w-11 h-11 rounded-xl flex items-center justify-center hover:bg-white transition-all text-slate-600 group">
            <i className="fa-solid fa-home group-hover:scale-110 transition-transform"></i>
          </button>
          <div className={`${ui.panel} px-6 py-2 rounded-xl flex gap-6 items-center shadow-sm`}>
             <div className="flex flex-col">
               <span className="text-[10px] uppercase font-bold opacity-40">Score</span>
               <span className="text-xl font-black leading-tight text-indigo-600">{score}</span>
             </div>
             <div className="w-[1px] h-8 bg-current opacity-10"></div>
             <div className="flex items-center gap-2">
                <span className="text-2xl drop-shadow-sm">{activeSprite?.type}</span>
                <div className="flex flex-col">
                  <span className="text-[10px] uppercase font-bold opacity-40">Sprite</span>
                  <span className="text-xs font-bold">Active</span>
                </div>
             </div>
          </div>
        </div>
      </header>

      {isMenuOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-start p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="glass w-72 rounded-3xl p-6 shadow-2xl border-2 border-white animate-in slide-in-from-left-8 duration-300">
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-black text-xl text-slate-700">Select Theme</h2>
              <button onClick={() => setIsMenuOpen(false)} className="text-slate-400 hover:text-rose-500"><i className="fa-solid fa-times text-xl"></i></button>
            </div>
            <div className="space-y-3">
              {THEMES.map(t => (
                <button key={t.id} onClick={() => selectTheme(t)} className={`w-full flex items-center gap-4 p-3 rounded-2xl transition-all border-2 ${activeTheme.id === t.id ? 'bg-indigo-600 text-white border-indigo-400 shadow-lg' : 'bg-white/80 text-slate-600 border-transparent hover:border-indigo-200 hover:bg-white'}`}>
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${activeTheme.id === t.id ? 'bg-white/20' : 'bg-indigo-50'}`}><i className={`fa-solid ${t.icon} ${activeTheme.id === t.id ? 'text-white' : 'text-indigo-500'}`}></i></div>
                  <div className="text-left">
                    <span className="block text-[10px] font-black uppercase opacity-60">Level {t.id}</span>
                    <span className="font-bold text-sm">{t.title}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      <main className="flex-1 flex gap-4 p-4 overflow-hidden relative z-10">
        <aside className="w-64 flex flex-col gap-4">
          <div className={`${ui.panel} rounded-3xl p-5 flex flex-col gap-6 shadow-sm flex-1`}>
            <section className="space-y-3">
              <h3 className="text-[10px] font-black uppercase tracking-widest flex items-center gap-2 opacity-50"><i className="fa-solid fa-layer-group"></i> Components</h3>
              <div onClick={() => addBlockToStack('motion')} className={`${activeTheme.blockColors.motion} p-3 rounded-xl text-white text-[13px] font-bold cursor-pointer hover:brightness-110 transition-all shadow-md border-b-4 border-black/20 block-notch`}>
                <i className="fa-solid fa-location-dot mr-2 opacity-60"></i>Go to x, y
              </div>
              <div onClick={() => addBlockToStack('glide')} className={`${activeTheme.blockColors.glide} p-3 rounded-xl text-white text-[13px] font-bold cursor-pointer hover:brightness-110 transition-all shadow-md border-b-4 border-black/20 block-notch`}>
                <i className="fa-solid fa-paper-plane mr-2 opacity-60"></i>Glide to x, y
              </div>
              <div onClick={() => addBlockToStack('say')} className={`${activeTheme.blockColors.say} p-3 rounded-xl text-white text-[13px] font-bold cursor-pointer hover:brightness-110 transition-all shadow-md border-b-4 border-black/20 block-notch`}>
                <i className="fa-solid fa-comment mr-2 opacity-60"></i>Say text
              </div>
            </section>
            <section className="flex-1 overflow-y-auto">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-[10px] font-black uppercase tracking-widest opacity-50">Characters</h3>
                {unlockedCount < ALL_AVAILABLE_SPRITES.length && <span className="text-[9px] font-black text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">Next in {POINTS_PER_UNLOCK - currentProgress} pts</span>}
              </div>
              <div className="h-1.5 w-full bg-slate-200/30 rounded-full mb-4 overflow-hidden">
                <div className="h-full bg-gradient-to-r from-amber-400 to-orange-500 transition-all duration-500" style={{ width: `${(currentProgress / POINTS_PER_UNLOCK) * 100}%` }}></div>
              </div>
              <div className="grid grid-cols-2 gap-3 pb-8">
                {ALL_AVAILABLE_SPRITES.map((s, idx) => {
                  const isLocked = idx >= unlockedCount;
                  const pointsNeededForThis = (idx - INITIAL_UNLOCKED + 1) * POINTS_PER_UNLOCK - score;
                  return (
                    <div key={s} className="relative group/sprite">
                      <button onMouseEnter={() => isLocked && setHoveredSprite(idx)} onMouseLeave={() => setHoveredSprite(null)} onClick={() => addNewSprite(s, isLocked, idx)} className={`w-full h-14 relative overflow-hidden bg-white/20 border-2 rounded-xl flex items-center justify-center text-2xl transition-all shadow-sm active:scale-90 ${isLocked ? 'grayscale border-transparent cursor-not-allowed opacity-40' : 'hover:border-current border-transparent'}`}>
                        {s}
                        {isLocked && <div className="absolute inset-0 bg-black/10 flex items-center justify-center"><i className="fa-solid fa-lock text-[10px] text-white/60"></i></div>}
                      </button>
                      {isLocked && hoveredSprite === idx && (
                        <div className="absolute z-50 left-full ml-2 top-0 bg-slate-800 text-white text-[10px] font-black px-3 py-2 rounded-lg whitespace-nowrap shadow-xl animate-in fade-in slide-in-from-left-2 duration-200">
                          <div className="flex items-center gap-2"><i className="fa-solid fa-star text-amber-400"></i>Need {pointsNeededForThis} pts</div>
                          <div className="absolute left-[-4px] top-4 w-2 h-2 bg-slate-800 rotate-45"></div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </section>
          </div>
        </aside>

        <section className={`w-96 ${ui.panel} rounded-3xl p-5 flex flex-col gap-4 shadow-sm`}>
          <div className={`bg-${activeTheme.accentColor}-500/10 p-3 rounded-2xl border border-${activeTheme.accentColor}-500/20`}>
            <span className={`block text-[10px] font-black text-${activeTheme.accentColor}-500 uppercase tracking-tighter mb-1`}>Objective</span>
            <p className="text-xs font-bold italic opacity-80">"{activeTheme.goal}"</p>
          </div>
          <div className="flex-1 overflow-y-auto pr-2 space-y-4 pt-2">
            {stack.length === 0 ? (
              <div className="h-full border-4 border-dashed border-current opacity-10 rounded-3xl flex flex-col items-center justify-center text-center p-8">
                <p className="font-bold text-sm">Craft your logic here</p>
              </div>
            ) : (
              stack.map((block, idx) => (
                <div key={block.id} className="relative group animate-in slide-in-from-left-4 duration-300">
                  <div className={`${block.type === 'motion' ? activeTheme.blockColors.motion : block.type === 'glide' ? activeTheme.blockColors.glide : block.type === 'say' ? activeTheme.blockColors.say : ''} p-4 rounded-xl text-white text-[14px] font-bold shadow-xl flex flex-wrap items-center gap-3 border-b-4 border-black/20 block-notch ${idx > 0 ? 'mt-1' : ''}`}>
                    {block.type === 'say' ? (
                      <>
                        <span>say</span>
                        <input type="text" value={block.text} onChange={(e) => updateBlockValue(block.id, 'text', e.target.value)} className={`${ui.input} flex-1 min-w-[120px] text-white rounded-lg px-3 py-1.5 focus:outline-none border focus:bg-white/30 transition-colors`} />
                        <span>for</span>
                        <input type="number" value={block.duration ?? ''} onChange={(e) => updateBlockValue(block.id, 'duration', e.target.value)} className={`${ui.input} w-16 text-white rounded-lg py-1.5 text-center focus:outline-none border`} />
                        <span>s</span>
                      </>
                    ) : (
                      <>
                        <span className="capitalize">{block.type === 'glide' ? 'glide' : 'go'} x:</span>
                        <input type="number" placeholder="" value={block.x ?? ''} onChange={(e) => updateBlockValue(block.id, 'x', e.target.value)} className={`${ui.input} w-24 text-white placeholder-white/30 rounded-lg px-2 py-1.5 text-center focus:outline-none border focus:bg-white/30 transition-colors`} />
                        <span>y:</span>
                        <input type="number" placeholder="" value={block.y ?? ''} onChange={(e) => updateBlockValue(block.id, 'y', e.target.value)} className={`${ui.input} w-24 text-white placeholder-white/30 rounded-lg px-2 py-1.5 text-center focus:outline-none border focus:bg-white/30 transition-colors`} />
                      </>
                    )}
                    <button onClick={() => removeBlock(block.id)} className="ml-auto opacity-100 bg-black/20 hover:bg-rose-500 w-8 h-8 rounded-full flex items-center justify-center text-xs transition-all"><i className="fa-solid fa-trash"></i></button>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>

        <section className="flex-1 flex flex-col gap-4 overflow-hidden">
          <div className={`flex-1 ${activeTheme.bgClass} transition-colors duration-1000 rounded-[2.5rem] shadow-2xl border-8 ${activeTheme.id === 5 ? 'border-indigo-900' : 'border-white'} relative overflow-hidden group`}>
            <div className={`absolute inset-0 ${activeTheme.id === 5 ? 'opacity-20' : 'opacity-[0.05]'} pointer-events-none`} style={{ backgroundImage: activeTheme.id === 5 ? 'linear-gradient(#4338ca 1px, transparent 1px), linear-gradient(90deg, #4338ca 1px, transparent 1px)' : 'linear-gradient(#000 1px, transparent 1px), linear-gradient(90deg, #000 1px, transparent 1px)', backgroundSize: '50px 50px' }}></div>
            <div className={`absolute left-1/2 top-0 bottom-0 w-[2px] ${activeTheme.id === 5 ? 'bg-indigo-400/30' : 'bg-slate-200'} shadow-[0_0_10px_rgba(0,0,0,0.05)]`}></div>
            <div className={`absolute top-1/2 left-0 right-0 h-[2px] ${activeTheme.id === 5 ? 'bg-indigo-400/30' : 'bg-slate-200'} shadow-[0_0_10px_rgba(0,0,0,0.05)]`}></div>
            {xLabels.map(val => (
              <div key={`x-${val}`} className="absolute top-1/2 flex flex-col items-center pointer-events-none" style={{ left: `calc(50% + ${val}px)`, transform: 'translateX(-50%)' }}>
                <div className={`w-[1px] h-3 ${activeTheme.id === 5 ? 'bg-indigo-500/40' : 'bg-slate-300'}`}></div>
                <span className={`text-[10px] font-black ${activeTheme.id === 5 ? 'text-indigo-400' : 'text-slate-400'} mt-1 select-none`}>{val}</span>
              </div>
            ))}
            {yLabels.map(val => (
              <div key={`y-${val}`} className="absolute left-1/2 flex items-center pointer-events-none" style={{ top: `calc(50% - ${val}px)`, transform: 'translateY(-50%)' }}>
                <div className={`w-3 h-[1px] ${activeTheme.id === 5 ? 'bg-indigo-500/40' : 'bg-slate-300'}`}></div>
                <span className={`text-[10px] font-black ${activeTheme.id === 5 ? 'text-indigo-400' : 'text-slate-400'} ml-1 select-none`}>{val}</span>
              </div>
            ))}
            <div className="absolute transition-all duration-1000 cubic-bezier(0.34, 1.56, 0.64, 1) z-10" style={{ left: `calc(50% + ${targetPos.x}px)`, top: `calc(50% - ${targetPos.y}px)`, transform: 'translate(-50%, -50%)' }}>
              <div className="text-6xl animate-pulse drop-shadow-xl filter saturate-150 transform hover:scale-125 transition-transform">{activeTheme.targetEmoji}</div>
            </div>
            {sprites.map(s => {
              const isActive = activeSpriteId === s.id;
              const bubbleText = s.saying || (isActive ? collisionMessage : null);
              return (
                <div key={s.id} onClick={() => setActiveSpriteId(s.id)} className={`absolute transition-all duration-[800ms] cubic-bezier(0.4, 0, 0.2, 1) cursor-pointer ${isActive ? 'z-20 scale-100' : 'z-10 opacity-30 grayscale-[50%] scale-75'}`} style={{ left: `calc(50% + ${s.x}px)`, top: `calc(50% - ${s.y}px)`, transform: 'translate(-50%, -50%)' }}>
                  <div className="relative">
                    {bubbleText && (
                      <div className={`${activeTheme.id === 5 ? 'bg-indigo-900 border-indigo-400 text-indigo-100' : 'bg-white border-current text-indigo-600'} absolute -top-16 left-1/2 -translate-x-1/2 px-5 py-2 rounded-2xl shadow-2xl border-2 whitespace-nowrap text-sm font-black animate-in zoom-in slide-in-from-bottom-2 duration-300 z-50`}>
                        {bubbleText}
                        <div className={`${activeTheme.id === 5 ? 'bg-indigo-900 border-indigo-400' : 'bg-white border-current'} absolute -bottom-2 left-1/2 -translate-x-1/2 w-4 h-4 border-b-2 border-r-2 rotate-45`}></div>
                      </div>
                    )}
                    <div className="text-7xl select-none transition-all duration-300 drop-shadow-2xl hover:scale-110 active:scale-95">{s.type}</div>
                  </div>
                </div>
              );
            })}
          </div>
          <div className={`${ui.panel} h-32 rounded-[2rem] p-4 flex gap-4 overflow-x-auto shadow-sm items-center`}>
            {sprites.map(s => (
              <div key={s.id} className={`relative flex-shrink-0 w-32 h-24 rounded-2xl border-4 transition-all flex flex-col items-center justify-center gap-1 cursor-pointer group/card ${activeSpriteId === s.id ? 'border-current bg-white/10 shadow-inner' : 'border-transparent bg-black/5 opacity-50 hover:opacity-100 hover:border-current/20'}`} onClick={() => setActiveSpriteId(s.id)}>
                <div className="text-4xl drop-shadow-sm">{s.type}</div>
                <div className="text-[10px] font-black opacity-60 bg-white/10 px-2 py-0.5 rounded-full flex gap-1"><span>X:{s.x}</span><span className="opacity-20">|</span><span>Y:{s.y}</span></div>
                <button onClick={(e) => { e.stopPropagation(); deleteSprite(s.id); }} className="absolute -top-2 -right-2 w-7 h-7 bg-rose-500 text-white rounded-full flex items-center justify-center text-xs shadow-lg opacity-0 group-hover/card:opacity-100 hover:scale-110 transition-all"><i className="fa-solid fa-times"></i></button>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
