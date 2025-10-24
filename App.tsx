import React, { useState, useEffect, useRef, useMemo } from 'react';
import { marked } from 'marked';
import { getTitleFromContent, getContentSnippet } from './utils/parser';
import { generateFileStructure } from './services/geminiService';
import { Button, Card, BottomNav, Toolbar } from './components/ui';
import { Tree } from './components/Tree';
import type { Note, Screen, Theme, TreeNode, Stroke, Point, Tool } from './types';
import { createSketchId, ensureEmptySketch, getSketchData, setSketchData, makeSketchKey } from './utils/sketchStorage';


// --- Initial Data (Fallback) ---
const initialNotes: Note[] = [
  {
    id: 1,
    title: "Ide Proyek SAT18",
    content: "# Ide Proyek SAT18\n\nIni adalah catatan awal untuk proyek SAT18. Fokus utama adalah membangun PWA offline-first dengan fitur sketching dan sinkronisasi cloud.\n\n- **Fitur A:** Editor Markdown Live\n- **Fitur B:** Kanvas Sketsa\n- **Fitur C:** Sinkronisasi (Nanti)",
    updatedAt: "2 jam lalu"
  },
  {
    id: 2,
    title: "Struktur Komponen UI",
    content: "## Struktur Komponen UI\n\n- Button\n- Card\n- Modal\n- Toolbar\n- BottomNav",
    updatedAt: "1 hari lalu"
  }
];

// --- Drawing Utilities (reusable for SketchPage and SketchEmbed) ---
const drawStroke = (ctx: CanvasRenderingContext2D, s: Stroke) => {
    if (!s.points || s.points.length === 0) return;
    ctx.lineJoin = "round";
    ctx.lineCap = "round";
    ctx.strokeStyle = s.color;
    ctx.lineWidth = s.size;
    ctx.beginPath();
    ctx.moveTo(s.points[0].x, s.points[0].y);
    for (let i = 1; i < s.points.length; i++) {
      ctx.lineTo(s.points[i].x, s.points[i].y);
    }
    ctx.stroke();
};

const redrawAll = (ctx: CanvasRenderingContext2D, strokeList: Stroke[], themeParam: Theme, dpr: number = 1) => {
    const canvas = ctx.canvas;
    ctx.save();
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0); // Scale for DPR
    ctx.fillStyle = themeParam === "dark" ? "#1e293b" : "#ffffff";
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.restore();
    for (const s of strokeList) {
      drawStroke(ctx, s);
    }
};

// --- Embedded Sketch Component ---
const SketchEmbed = ({ sketchId, onClick, theme }: { sketchId: string; onClick: () => void; theme: Theme }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [revision, setRevision] = useState(0); // State to trigger redraw on storage event

    // Effect for listening to storage changes to enable real-time updates
    useEffect(() => {
        const handleStorageChange = (event: StorageEvent) => {
            if (event.key === makeSketchKey(sketchId)) {
                setRevision(rev => rev + 1);
            }
        };

        window.addEventListener('storage', handleStorageChange);
        return () => {
            window.removeEventListener('storage', handleStorageChange);
        };
    }, [sketchId]);

    // Effect for drawing/redrawing the canvas content
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;
        
        const strokes = getSketchData(sketchId);
        // Simple redraw on a small canvas, no need for complex DPR scaling here for a preview
        redrawAll(ctx, strokes, theme);

    }, [sketchId, theme, revision]); // revision dependency will trigger this effect

    return (
        <div 
            className="my-4 p-2 border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-lg cursor-pointer hover:border-indigo-500 dark:hover:border-indigo-400 transition-colors"
            onClick={onClick}
        >
            <canvas ref={canvasRef} width="300" height="150" className="bg-white dark:bg-slate-800 rounded-md" />
            <p className="text-xs text-center text-slate-500 dark:text-slate-400 mt-1">Klik untuk mengedit sketsa</p>
        </div>
    );
};

// --- Page Components (from apps/web/src/pages) ---

const DashboardPage = ({ notes, onNavigate, onCreateNote, onSelectNote }: { notes: Note[], onNavigate: (screen: Screen, context?: any) => void, onCreateNote: () => void, onSelectNote: (id: number) => void }) => (
  <div>
    <header className="text-center mb-8 md:mb-12">
      <h1 className="text-4xl sm:text-5xl font-bold text-slate-900 dark:text-white tracking-tight">Dashboard</h1>
      <p className="mt-4 text-lg text-slate-500 dark:text-slate-400 max-w-2xl mx-auto">Selamat datang di SAT18. Mulai buat catatan, sketsa, atau visualisasikan struktur proyek Anda.</p>
    </header>
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
      <Card
        icon="📘"
        title="Catatan Teks"
        description="Buat catatan baru dengan editor markdown yang kaya fitur."
        buttonText="Buat Catatan Baru"
        onClick={onCreateNote}
      />
       <Card
        icon="📂"
        title="Visualizer Struktur"
        description="Gunakan AI untuk memvisualisasikan arsitektur file dari deskripsi teks."
        buttonText="Buka Visualizer"
        onClick={() => onNavigate('visualizer')}
      />
      <Card
        icon="✏️"
        title="Sketsa"
        description="Buka kanvas kosong untuk menuangkan ide visual Anda."
        buttonText="Buka Kanvas Baru"
        onClick={() => onNavigate('sketch', 'default')}
      />
    </div>
    
    <div className="mt-10">
      <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">Catatan Terbaru</h2>
      <div className="space-y-4">
        {notes.length > 0 ? notes.map(note => (
           <div key={note.id} onClick={() => onSelectNote(note.id)} className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-4 flex justify-between items-center cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors shadow-sm">
             <div className="flex-1 overflow-hidden">
               <h3 className="font-semibold text-slate-800 dark:text-slate-200 truncate">{note.title}</h3>
               <p className="text-sm text-slate-500 dark:text-slate-400 truncate">{getContentSnippet(note.content)}</p>
             </div>
             <span className="text-slate-400 dark:text-slate-500 ml-4">&rarr;</span>
           </div>
        )) : (
          <div className="text-center py-8 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-lg">
            <p className="text-slate-500 dark:text-slate-400">Belum ada catatan.</p>
            <Button onClick={onCreateNote} variant="ghost" className="mt-2">Buat catatan pertama Anda</Button>
          </div>
        )}
      </div>
    </div>
  </div>
);

const EditorPage = ({ note, onNavigate, onUpdateNote, theme, onEmbedSketch }: { note: Note | undefined; onNavigate: (screen: Screen, context?: any) => void; onUpdateNote: (content: string) => void; theme: Theme; onEmbedSketch: (callback: (id: string) => void) => void; }) => {
  const [content, setContent] = useState(note?.content || '');
  const textAreaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    setContent(note?.content || '');
  }, [note]);

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setContent(e.target.value);
    onUpdateNote(e.target.value);
  };
  
  const handleAddSketchClick = () => {
    onEmbedSketch((sketchId) => {
        const tag = `\n[[sketch:${sketchId}]]\n`;
        const textarea = textAreaRef.current;
        if (textarea) {
            const start = textarea.selectionStart;
            const end = textarea.selectionEnd;
            const newContent = content.substring(0, start) + tag + content.substring(end);
            setContent(newContent);
            onUpdateNote(newContent);
            // Focus and move cursor after the inserted tag
            setTimeout(() => {
                textarea.focus();
                textarea.selectionStart = textarea.selectionEnd = start + tag.length;
            }, 0);
        } else {
            // Fallback if ref is not available
            const newContent = content + tag;
            setContent(newContent);
            onUpdateNote(newContent);
        }
    });
  };

  const renderContentWithEmbeds = (text: string) => {
    const parts = text.split(/(\[\[sketch:.+?\]\])/g);
    return parts.map((part, index) => {
      const match = part.match(/\[\[sketch:(.+)\]\]/);
      if (match) {
        const sketchId = match[1];
        return <SketchEmbed 
            key={`${sketchId}-${index}`} 
            sketchId={sketchId} 
            theme={theme}
            onClick={() => onNavigate('sketch', sketchId)}
        />;
      } else {
        // Render markdown only for non-empty parts
        if (part) {
            return <div key={index} dangerouslySetInnerHTML={{ __html: marked(part) }} />;
        }
        return null;
      }
    });
  };

  if (!note) {
    return (
      <div className="text-center p-12">
        <p className="text-slate-500 dark:text-slate-400">Catatan tidak ditemukan. Silakan kembali ke dashboard.</p>
        <Button onClick={() => onNavigate('dashboard')} variant="ghost" className="mt-4">
          &larr; Kembali ke Dashboard
        </Button>
      </div>
    );
  }

  return (
    <div className="h-[75vh] flex flex-col bg-white/50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-lg shadow-inner">
      <Toolbar>
        <Button onClick={() => onNavigate('dashboard')} variant="ghost">&larr; Kembali</Button>
        <div className="flex items-center gap-2">
            <Button onClick={handleAddSketchClick} variant="secondary">🖌️ Tambah Sketsa</Button>
            <span className="text-sm text-slate-500 dark:text-slate-400 animate-pulse hidden sm:inline">Otomatis tersimpan 💾</span>
        </div>
      </Toolbar>
      <div className="flex-grow flex flex-col md:flex-row">
        {/* Editor Text Area */}
        <div className="w-full md:w-1/2 h-1/2 md:h-full p-4 border-b md:border-b-0 md:border-r border-slate-200 dark:border-slate-700">
            <textarea
              ref={textAreaRef}
              className="w-full h-full bg-transparent text-slate-800 dark:text-slate-200 resize-none focus:outline-none placeholder-slate-400 dark:placeholder-slate-500"
              placeholder="Tulis dalam Markdown..."
              value={content}
              onChange={handleContentChange}
              aria-label="Editor Catatan"
            />
        </div>
        {/* Live Preview */}
        <div className="w-full md:w-1/2 h-1/2 md:h-full p-4 overflow-y-auto">
            <div className="prose prose-slate dark:prose-invert max-w-none">
                {renderContentWithEmbeds(content)}
            </div>
        </div>
      </div>
    </div>
  );
};


// --- Advanced Sketch Page ---

const SketchToolbar = ({ tool, onChange, onClear, onUndo, onExport }: { tool: Tool; onChange: (tool: Tool) => void; onClear: () => void; onUndo: () => void; onExport: () => void; }) => {
  const colorOptions = ["#111827", "#ef4444", "#f59e0b", "#10b981", "#0ea5a4", "#64748b"];
  return (
    <div className="flex gap-2 sm:gap-4 items-center flex-wrap">
      <div className="flex gap-2">
        {colorOptions.map((c) => (
          <button
            key={c}
            onClick={() => onChange({ ...tool, color: c })}
            className={`w-7 h-7 rounded-md transition-transform transform hover:scale-110 ${c === tool.color ? 'ring-2 ring-offset-2 ring-indigo-500 dark:ring-offset-slate-800' : 'ring-1 ring-inset ring-black/10'}`}
            style={{ backgroundColor: c }}
            aria-label={`Pilih warna ${c}`}
          />
        ))}
      </div>
      <div className="flex items-center gap-2">
        <label htmlFor="lineWidth" className="text-sm font-medium sr-only sm:not-sr-only">Size:</label>
        <input
          id="lineWidth"
          type="range"
          min="1"
          max="40"
          value={tool.size}
          onChange={(e) => onChange({ ...tool, size: Number(e.target.value) })}
          className="w-24"
        />
        <span className="text-sm text-slate-500 dark:text-slate-400 min-w-[28px] text-center">{tool.size}px</span>
      </div>
      <div className="ml-auto flex gap-2">
        <Button onClick={onUndo} variant="secondary">Undo</Button>
        <Button onClick={onClear} variant="secondary">Clear</Button>
        <Button onClick={onExport} variant="primary">Export</Button>
      </div>
    </div>
  );
};

const SketchPage = ({ onNavigate, theme, sketchId, activeNoteId }: { onNavigate: (screen: Screen, context?: any) => void; theme: Theme; sketchId: string; activeNoteId: number | null; }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentStroke, setCurrentStroke] = useState<Stroke | null>(null);
  
  const [strokes, setStrokes] = useState<Stroke[]>(() => getSketchData(sketchId));
  const [tool, setTool] = useState<Tool>({ color: '#111827', size: 4 });

  // Reload strokes if the sketchId changes (e.g., navigating between different sketches)
  useEffect(() => {
    setStrokes(getSketchData(sketchId));
  }, [sketchId]);
  
  // Resize canvas to container with DPR scaling
  useEffect(() => {
    const handleResize = () => {
      const canvas = canvasRef.current;
      const container = containerRef.current;
      if (!canvas || !container) return;
      const rect = container.getBoundingClientRect();
      const dpr = Math.max(window.devicePixelRatio || 1, 1);
      canvas.width = Math.floor(rect.width * dpr);
      canvas.height = Math.floor(rect.height * dpr);
      canvas.style.width = `${rect.width}px`;
      canvas.style.height = `${rect.height}px`;
      const ctx = canvas.getContext("2d");
      if(ctx){
        redrawAll(ctx, strokes, theme, dpr);
      }
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [strokes, theme]);

  // Save strokes to localStorage
  useEffect(() => {
    setSketchData(sketchId, strokes);
  }, [strokes, sketchId]);
  
  // Pointer event handlers
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if(!ctx) return;
    
    redrawAll(ctx, strokes, theme, Math.max(window.devicePixelRatio || 1, 1)); // Initial draw

    const getPos = (evt: PointerEvent): Point => {
      const rect = canvas.getBoundingClientRect();
      const dpr = Math.max(window.devicePixelRatio || 1, 1);
      return { x: (evt.clientX - rect.left) * dpr, y: (evt.clientY - rect.top) * dpr };
    };

    const drawIncremental = (pA: Point, pB: Point, s: Stroke) => {
      ctx.lineJoin = "round"; ctx.lineCap = "round";
      ctx.strokeStyle = s.color; ctx.lineWidth = s.size;
      ctx.beginPath(); ctx.moveTo(pA.x, pA.y);
      ctx.lineTo(pB.x, pB.y); ctx.stroke();
    };

    const onPointerDown = (e: PointerEvent) => {
      if(e.button !== 0) return; // Only main button
      e.preventDefault();
      (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
      const pos = getPos(e);
      const stroke: Stroke = { color: tool.color, size: tool.size, points: [pos] };
      setCurrentStroke(stroke);
      setIsDrawing(true);
    };

    const onPointerMove = (e: PointerEvent) => {
      if (!isDrawing || !currentStroke) return;
      const pos = getPos(e);
      setCurrentStroke((prev) => {
        if (!prev) return null;
        const lastPoint = prev.points[prev.points.length - 1];
        drawIncremental(lastPoint, pos, prev);
        return { ...prev, points: [...prev.points, pos] };
      });
    };

    const onPointerUp = (e: PointerEvent) => {
      if (!isDrawing || !currentStroke) return;
      (e.target as HTMLElement).releasePointerCapture?.(e.pointerId);
      setStrokes((prev) => [...prev, currentStroke]);
      setIsDrawing(false);
      setCurrentStroke(null);
    };

    canvas.addEventListener("pointerdown", onPointerDown);
    canvas.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);

    return () => {
      canvas.removeEventListener("pointerdown", onPointerDown);
      canvas.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
    };
  }, [isDrawing, currentStroke, strokes, tool, theme]);

  const clearAll = () => {
    setStrokes([]);
  };

  const undoLast = () => {
    setStrokes((prev) => prev.slice(0, -1));
  };

  const exportPNG = () => {
    const canvas = canvasRef.current;
    if(!canvas) return;
    const exportCanvas = document.createElement('canvas');
    const dpr = Math.max(window.devicePixelRatio || 1, 1);
    exportCanvas.width = canvas.width / dpr;
    exportCanvas.height = canvas.height / dpr;
    const exportCtx = exportCanvas.getContext('2d');
    if(!exportCtx) return;
    
    redrawAll(exportCtx, strokes, theme, 1); // Redraw at 1x DPR for export

    const url = exportCanvas.toDataURL("image/png");
    const link = document.createElement('a');
    link.download = `sat18-${sketchId}.png`;
    link.href = url;
    link.click();
  };

  const handleBackNavigation = () => {
      if (activeNoteId) {
          // If we came from a note, go back to the editor for that note
          onNavigate('editor', activeNoteId); 
      } else {
          // Otherwise, go back to the dashboard
          onNavigate('dashboard');
      }
  }

  return (
    <div className="h-[75vh] flex flex-col bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-inner">
        <Toolbar>
            <Button onClick={handleBackNavigation} variant="ghost">&larr; Kembali</Button>
            <SketchToolbar tool={tool} onChange={setTool} onClear={clearAll} onUndo={undoLast} onExport={exportPNG} />
        </Toolbar>
        <div ref={containerRef} className="flex-grow w-full h-full p-0 overflow-hidden rounded-b-lg">
             <canvas
                ref={canvasRef}
                className="w-full h-full block touch-none cursor-crosshair"
            />
        </div>
    </div>
  );
};


const FileStructureVisualizerPage = ({ onNavigate }: { onNavigate: (screen: Screen) => void }) => {
    const [prompt, setPrompt] = useState('sat18/\n  apps/\n    web/\n  packages/\n    ui/\n    core/');
    const [tree, setTree] = useState<TreeNode[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    const handleGenerate = async () => {
        setIsLoading(true);
        const generatedTree = await generateFileStructure(prompt);
        setTree(generatedTree);
        setIsLoading(false);
    };

    useEffect(() => {
        handleGenerate(); // Generate initial structure on load
    }, []);

    return (
        <div className="h-full flex flex-col bg-white/50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-lg shadow-inner">
            <Toolbar>
                <Button onClick={() => onNavigate('dashboard')} variant="ghost">&larr; Kembali</Button>
                <h2 className="font-semibold text-lg">File Structure Visualizer</h2>
            </Toolbar>
            <div className="flex-grow flex flex-col md:flex-row gap-4 p-4">
                <div className="flex-1 flex flex-col">
                    <label htmlFor="structure-prompt" className="mb-2 font-medium">Deskripsi Struktur (teks):</label>
                    <textarea
                        id="structure-prompt"
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        className="w-full h-full flex-1 p-3 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        placeholder="e.g., my-app/\n  src/\n    index.js"
                        rows={10}
                    />
                    <Button onClick={handleGenerate} className="mt-4 w-full" disabled={isLoading}>
                        {isLoading ? 'Membuat...' : 'Buat Visualisasi'}
                    </Button>
                </div>
                <div className="flex-1 p-4 bg-slate-50 dark:bg-slate-900/50 rounded-md border border-slate-200 dark:border-slate-700 min-h-[200px]">
                    <h3 className="font-medium mb-3 border-b pb-2">Visualisasi:</h3>
                    {isLoading ? (
                        <div className="animate-pulse space-y-2">
                           <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-3/4"></div>
                           <div className="pl-6"><div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-1/2"></div></div>
                           <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-full"></div>
                        </div>
                    ) : (
                        <Tree data={tree} />
                    )}
                </div>
            </div>
        </div>
    );
};

// --- Main App Component ---

const Layout = ({ children, onNavigate, activeScreen, theme, toggleTheme }: { children: React.ReactNode; onNavigate: (screen: Screen, context?: any) => void; activeScreen: Screen; theme: Theme; toggleTheme: () => void; }) => (
  <div className={`${theme} transition-colors duration-300`}>
    <div className="min-h-screen bg-slate-50 text-slate-800 dark:bg-slate-900 dark:text-slate-200 font-sans p-4 sm:p-6 lg:p-8 pb-24 md:pb-8">
      <div className="max-w-5xl mx-auto">
        <header className="flex justify-between items-center mb-8">
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <span className="text-indigo-600 dark:text-indigo-400">SAT18</span>
            <span className="text-slate-900 dark:text-white">- Interactive Prototype</span>
          </h1>
          <button onClick={toggleTheme} className="text-2xl p-2 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors" aria-label={`Ganti ke mode ${theme === 'dark' ? 'terang' : 'gelap'}`}>
            {theme === 'dark' ? '☀️' : '🌙'}
          </button>
        </header>
        <main>
          {children}
        </main>
      </div>
      <BottomNav onNavigate={onNavigate} activeScreen={activeScreen} />
    </div>
  </div>
);

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<Screen>('dashboard');
  const [activeNoteId, setActiveNoteId] = useState<number | null>(null);
  const [activeSketchId, setActiveSketchId] = useState<string | null>(null);

  // --- State with Persistence ---
  const [theme, setTheme] = useState<Theme>(() => (localStorage.getItem('theme') as Theme) || 'dark');
  const [notes, setNotes] = useState<Note[]>(() => {
    const savedNotes = sessionStorage.getItem('sat18-notes');
    return savedNotes ? JSON.parse(savedNotes) : initialNotes;
  });

  // --- Effects for Persistence ---
  useEffect(() => {
    localStorage.setItem('theme', theme);
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }, [theme]);

  useEffect(() => {
    sessionStorage.setItem('sat18-notes', JSON.stringify(notes));
  }, [notes]);
  
  const toggleTheme = () => {
    setTheme(prevTheme => (prevTheme === 'dark' ? 'light' : 'dark'));
  };

  const navigate = (screen: Screen, context?: any) => {
    window.scrollTo(0, 0); // Scroll to top on navigation
    
    // Handle sketch navigation
    if (screen === 'sketch' && typeof context === 'string') {
        setActiveSketchId(context);
    } else if (screen !== 'sketch') {
        setActiveSketchId(null);
    }

    // Handle note navigation
    if(screen === 'editor' && typeof context === 'number') {
        setActiveNoteId(context);
    } else if (screen !== 'sketch' && screen !== 'editor') {
        setActiveNoteId(null);
    }
    
    setCurrentScreen(screen);
  };
  
  const handleSelectNote = (id: number) => {
    setActiveNoteId(id);
    navigate('editor');
  };
  
  const handleCreateNote = () => {
    const newNote: Note = {
      id: Date.now(),
      title: "Catatan Baru",
      content: "# Catatan Baru\n\n",
      updatedAt: "Baru saja"
    };
    setNotes(prevNotes => [newNote, ...prevNotes]);
    setActiveNoteId(newNote.id);
    navigate('editor');
  };
  
  const handleUpdateNote = (content: string) => {
    setNotes(prevNotes => 
      prevNotes.map(note => 
        note.id === activeNoteId 
        ? { ...note, content, title: getTitleFromContent(content), updatedAt: "Baru saja" } 
        : note
      )
    );
  };
  
  const handleEmbedSketch = (callback: (id: string) => void) => {
    const sketchId = createSketchId();
    ensureEmptySketch(sketchId); // Initialize empty sketch in storage
    callback(sketchId);
  };
  
  const activeNote = notes.find(n => n.id === activeNoteId);

  const renderScreen = () => {
    switch (currentScreen) {
      case 'dashboard':
        return <DashboardPage notes={notes} onNavigate={navigate} onCreateNote={handleCreateNote} onSelectNote={handleSelectNote} />;
      case 'editor':
        return <EditorPage note={activeNote} onNavigate={navigate} onUpdateNote={handleUpdateNote} theme={theme} onEmbedSketch={handleEmbedSketch} />;
      case 'sketch':
        if (!activeSketchId) {
             // Fallback if somehow sketch page is loaded without an ID
            setTimeout(() => navigate('dashboard'), 0);
            return null;
        }
        return <SketchPage onNavigate={navigate} theme={theme} sketchId={activeSketchId} activeNoteId={activeNoteId} />;
      case 'visualizer':
        return <FileStructureVisualizerPage onNavigate={navigate} />;
      case 'settings':
        return <DashboardPage notes={notes} onNavigate={navigate} onCreateNote={handleCreateNote} onSelectNote={handleSelectNote} />; // Placeholder
      default:
        return <DashboardPage notes={notes} onNavigate={navigate} onCreateNote={handleCreateNote} onSelectNote={handleSelectNote} />;
    }
  };

  return (
    <Layout onNavigate={navigate} activeScreen={currentScreen} theme={theme} toggleTheme={toggleTheme}>
      {renderScreen()}
    </Layout>
  );
}