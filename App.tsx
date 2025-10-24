import React, { useState, useEffect } from 'react';

// --- Type Definitions ---
type Screen = 'dashboard' | 'editor' | 'sketch' | 'viewer' | 'settings';
type Theme = 'dark' | 'light';
type Note = {
  id: number;
  title: string;
  content: string;
  updatedAt: string;
};

// --- Initial Data ---
const initialNotes: Note[] = [
  {
    id: 1,
    title: "Ide Proyek SAT18",
    content: "# Ide Proyek SAT18\n\nIni adalah catatan awal untuk proyek SAT18. Fokus utama adalah membangun PWA offline-first dengan fitur sketching dan sinkronisasi cloud.",
    updatedAt: "2 jam lalu"
  },
  {
    id: 2,
    title: "Struktur Komponen UI",
    content: "# Struktur Komponen UI\n\n- Button\n- Card\n- Modal\n- Toolbar\n- BottomNav",
    updatedAt: "1 hari lalu"
  }
];

// --- Helper Functions ---
const getTitleFromContent = (content: string) => {
  const firstLine = content.split('\n')[0];
  const cleanedTitle = firstLine.replace(/#/g, '').trim();
  return cleanedTitle || "Catatan Tanpa Judul";
};

// --- Reusable UI Components (from packages/ui) ---

const Button = ({ children, onClick, variant = 'primary', className = '' }: { children: React.ReactNode; onClick: (e?: React.MouseEvent) => void; variant?: 'primary' | 'secondary' | 'ghost'; className?: string; }) => {
  const baseClasses = 'font-bold py-3 px-4 rounded-lg transition-all focus:outline-none focus:ring-2 focus:ring-offset-2';
  const variants = {
    primary: 'bg-indigo-600 text-white hover:bg-indigo-500 focus:ring-indigo-400 dark:focus:ring-offset-slate-900',
    secondary: 'bg-slate-200 text-slate-800 hover:bg-slate-300 focus:ring-slate-400 dark:bg-slate-700 dark:text-slate-300 dark:hover:bg-slate-600 dark:focus:ring-slate-500 dark:focus:ring-offset-slate-900',
    ghost: 'bg-transparent text-indigo-600 hover:bg-indigo-100 focus:ring-indigo-500 dark:text-indigo-400 dark:hover:bg-indigo-500/10 dark:focus:ring-offset-slate-900',
  };
  return (
    <button onClick={onClick} className={`${baseClasses} ${variants[variant]} ${className}`}>
      {children}
    </button>
  );
};

const Card = ({ title, description, buttonText, icon, onClick }: { title: string; description: string; buttonText: string; icon: string; onClick: () => void; }) => (
  <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-6 flex flex-col items-start h-full shadow-sm hover:shadow-lg transition-shadow">
    <div className="flex items-center gap-4 mb-4">
      <span className="text-3xl">{icon}</span>
      <h3 className="text-xl font-bold text-slate-900 dark:text-white">{title}</h3>
    </div>
    <p className="text-slate-500 dark:text-slate-400 mb-6 flex-grow">{description}</p>
    <Button onClick={onClick} className="w-full mt-auto">
      {buttonText}
    </Button>
  </div>
);

const BottomNav = ({ onNavigate, activeScreen }: { onNavigate: (screen: Screen) => void; activeScreen: Screen; }) => {
  const navItems = [
    { id: 'dashboard', icon: '🏠', label: 'Home' },
    { id: 'sketch', icon: '🎨', label: 'Sketch' },
    { id: 'settings', icon: '⚙️', label: 'Settings' },
  ];
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border-t border-slate-200 dark:border-slate-700 md:hidden z-50">
      <div className="max-w-md mx-auto flex justify-around">
        {navItems.map(item => (
          <button
            key={item.id}
            onClick={() => onNavigate(item.id as Screen)}
            className={`flex flex-col items-center gap-1 p-3 w-full text-sm font-medium transition-colors ${activeScreen === item.id ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'}`}
            aria-current={activeScreen === item.id ? 'page' : undefined}
          >
            <span className="text-2xl">{item.icon}</span>
            <span>{item.label}</span>
          </button>
        ))}
      </div>
    </nav>
  );
};

const Toolbar = ({ children }: { children: React.ReactNode }) => (
  <header className="flex items-center justify-between p-4 bg-white/50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700 rounded-t-lg">
    {children}
  </header>
);

const Modal = ({ isOpen, onClose, title, children }: { isOpen: boolean; onClose: () => void; title: string; children: React.ReactNode; }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={onClose} role="dialog" aria-modal="true" aria-labelledby="modal-title">
      <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-6 max-w-sm w-full shadow-2xl" onClick={e => e.stopPropagation()}>
        <h2 id="modal-title" className="text-xl font-bold text-slate-900 dark:text-white mb-4">{title}</h2>
        <div className="text-slate-600 dark:text-slate-300 mb-6">{children}</div>
        <Button onClick={onClose} className="w-full">Tutup</Button>
      </div>
    </div>
  );
};

// --- Page Components (from apps/web/src/pages) ---

const DashboardPage = ({ notes, onNavigate, onCreateNote, onSelectNote }: { notes: Note[], onNavigate: (screen: Screen) => void, onCreateNote: () => void, onSelectNote: (id: number) => void }) => (
  <div>
    <header className="text-center mb-8 md:mb-12">
      <h1 className="text-4xl sm:text-5xl font-bold text-slate-900 dark:text-white tracking-tight">Dashboard</h1>
      <p className="mt-4 text-lg text-slate-500 dark:text-slate-400 max-w-2xl mx-auto">Selamat datang di SAT18. Mulai buat catatan, sketsa, atau kelola pengaturan Anda.</p>
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
        icon="✏️"
        title="Sketsa"
        description="Buka kanvas kosong untuk menuangkan ide visual Anda."
        buttonText="Buka Kanvas Baru"
        onClick={() => onNavigate('sketch')}
      />
      <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-6 flex flex-col items-start md:col-span-2 lg:col-span-1 h-full shadow-sm">
        <div className="flex items-center gap-4 mb-4">
          <span className="text-3xl">☁️</span>
          <h3 className="text-xl font-bold text-slate-900 dark:text-white">Sinkronisasi</h3>
        </div>
        <p className="text-slate-500 dark:text-slate-400 mb-6 flex-grow">Hubungkan ke cloud untuk backup dan akses multi-device (segera hadir).</p>
        <Button onClick={() => { }} variant="secondary" className="w-full mt-auto cursor-not-allowed opacity-50">
          Hubungkan Cloud
        </Button>
      </div>
    </div>
    
    <div className="mt-10">
      <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">Catatan Terbaru</h2>
      <div className="space-y-4">
        {notes.length > 0 ? notes.map(note => (
           <div key={note.id} onClick={() => onSelectNote(note.id)} className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-4 flex justify-between items-center cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors shadow-sm">
             <div>
               <h3 className="font-semibold text-slate-800 dark:text-slate-200">{note.title}</h3>
               <p className="text-sm text-slate-500 dark:text-slate-400">Diperbarui: {note.updatedAt}</p>
             </div>
             <span className="text-slate-400 dark:text-slate-500">&rarr;</span>
           </div>
        )) : (
          <p className="text-slate-500 dark:text-slate-400 text-center py-4">Belum ada catatan.</p>
        )}
      </div>
    </div>
  </div>
);

const EditorPage = ({ note, onNavigate, onUpdateNote }: { note: Note | undefined; onNavigate: (screen: Screen) => void; onUpdateNote: (content: string) => void }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [content, setContent] = useState(note?.content || '');

  useEffect(() => {
    setContent(note?.content || '');
  }, [note]);

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setContent(e.target.value);
    onUpdateNote(e.target.value);
  };
  
  const handleSave = () => {
    // In a real app, this would be an async operation
    setIsModalOpen(true);
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
        <div className="flex gap-2">
          <Button onClick={() => onNavigate('viewer')} variant="secondary">Lihat</Button>
          <Button onClick={handleSave}>Simpan</Button>
        </div>
      </Toolbar>
      <div className="flex-grow p-4">
        <textarea
          className="w-full h-full bg-transparent text-slate-800 dark:text-slate-200 resize-none focus:outline-none placeholder-slate-400 dark:placeholder-slate-500"
          placeholder="Mulai tulis catatan Anda di sini..."
          value={content}
          onChange={handleContentChange}
        />
      </div>
      <footer className="flex items-center justify-center gap-4 p-3 bg-white/50 dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700 rounded-b-lg">
        <button className="text-xl p-2 rounded-md hover:bg-slate-200 dark:hover:bg-slate-700"><b>B</b></button>
        <button className="text-xl p-2 rounded-md hover:bg-slate-200 dark:hover:bg-slate-700"><i>i</i></button>
        <button className="text-xl p-2 rounded-md hover:bg-slate-200 dark:hover:bg-slate-700">●</button>
        <button className="text-xl p-2 rounded-md hover:bg-slate-200 dark:hover:bg-slate-700">1.</button>
        <button className="text-xl p-2 rounded-md hover:bg-slate-200 dark:hover:bg-slate-700">🖼️</button>
      </footer>
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Catatan Disimpan">
        <p>Catatan Anda telah berhasil disimpan secara lokal.</p>
      </Modal>
    </div>
  );
};

const PlaceholderPage = ({ screenName, onNavigate }: { screenName: string; onNavigate: (screen: Screen) => void }) => (
  <div className="text-center bg-white/50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-lg p-12 flex flex-col items-center justify-center min-h-[50vh] shadow-inner">
    <h1 className="text-4xl font-bold text-slate-900 dark:text-white mb-4">{screenName}</h1>
    <p className="text-slate-500 dark:text-slate-400 mb-8 max-w-md">Halaman ini adalah placeholder dan akan diimplementasikan pada tahap pengembangan selanjutnya.</p>
    <Button onClick={() => onNavigate('dashboard')} variant="ghost">
      &larr; Kembali ke Dashboard
    </Button>
  </div>
);

// --- Main App Component ---

const Layout = ({ children, onNavigate, activeScreen, theme, toggleTheme }: { children: React.ReactNode; onNavigate: (screen: Screen) => void; activeScreen: Screen; theme: Theme; toggleTheme: () => void; }) => (
  <div className={`${theme} transition-colors duration-300`}>
    <div className="min-h-screen bg-slate-50 text-slate-800 dark:bg-slate-900 dark:text-slate-200 font-sans p-4 sm:p-6 lg:p-8 pb-24 md:pb-8">
      <div className="max-w-5xl mx-auto">
        <header className="flex justify-between items-center mb-8">
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <span className="text-indigo-600 dark:text-indigo-400">SAT18</span>
            <span className="text-slate-900 dark:text-white">- Interactive Prototype</span>
          </h1>
          <button onClick={toggleTheme} className="text-2xl p-2 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
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
  const [notes, setNotes] = useState<Note[]>(initialNotes);
  const [activeNoteId, setActiveNoteId] = useState<number | null>(null);
  const [theme, setTheme] = useState<Theme>('dark');
  
  const toggleTheme = () => {
    setTheme(prevTheme => (prevTheme === 'dark' ? 'light' : 'dark'));
  };

  const navigate = (screen: Screen) => {
    window.scrollTo(0, 0); // Scroll to top on navigation
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
    setNotes([newNote, ...notes]);
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
  
  const activeNote = notes.find(n => n.id === activeNoteId);

  const renderScreen = () => {
    switch (currentScreen) {
      case 'dashboard':
        return <DashboardPage notes={notes} onNavigate={navigate} onCreateNote={handleCreateNote} onSelectNote={handleSelectNote} />;
      case 'editor':
        return <EditorPage note={activeNote} onNavigate={navigate} onUpdateNote={handleUpdateNote} />;
      case 'sketch':
        return <PlaceholderPage screenName="Sketchpad" onNavigate={navigate} />;
      case 'settings':
        return <PlaceholderPage screenName="Settings" onNavigate={navigate} />;
      case 'viewer':
        return <PlaceholderPage screenName="Viewer" onNavigate={navigate} />;
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
