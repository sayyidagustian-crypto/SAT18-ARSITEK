import React from 'react';
import type { Screen } from '../types';

export const Button = ({ children, onClick, variant = 'primary', className = '', disabled = false }: { children: React.ReactNode; onClick: (e?: React.MouseEvent) => void; variant?: 'primary' | 'secondary' | 'ghost'; className?: string; disabled?: boolean; }) => {
  const baseClasses = 'font-bold py-3 px-4 rounded-lg transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';
  const variants = {
    primary: 'bg-indigo-600 text-white hover:bg-indigo-500 focus:ring-indigo-400 dark:focus:ring-offset-slate-900',
    secondary: 'bg-slate-200 text-slate-800 hover:bg-slate-300 focus:ring-slate-400 dark:bg-slate-700 dark:text-slate-300 dark:hover:bg-slate-600 dark:focus:ring-slate-500 dark:focus:ring-offset-slate-900',
    ghost: 'bg-transparent text-indigo-600 hover:bg-indigo-100 focus:ring-indigo-500 dark:text-indigo-400 dark:hover:bg-indigo-500/10 dark:focus:ring-offset-slate-900',
  };
  return (
    <button onClick={onClick} className={`${baseClasses} ${variants[variant]} ${className}`} disabled={disabled}>
      {children}
    </button>
  );
};

export const Card = ({ title, description, buttonText, icon, onClick, disabled = false }: { title: string; description: string; buttonText: string; icon: string; onClick: () => void; disabled?: boolean }) => (
  <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-6 flex flex-col items-start h-full shadow-sm hover:shadow-lg transition-shadow">
    <div className="flex items-center gap-4 mb-4">
      <span className="text-3xl">{icon}</span>
      <h3 className="text-xl font-bold text-slate-900 dark:text-white">{title}</h3>
    </div>
    <p className="text-slate-500 dark:text-slate-400 mb-6 flex-grow">{description}</p>
    <Button onClick={onClick} className="w-full mt-auto" variant={disabled ? 'secondary' : 'primary'} disabled={disabled}>
      {buttonText}
    </Button>
  </div>
);

export const BottomNav = ({ onNavigate, activeScreen }: { onNavigate: (screen: Screen) => void; activeScreen: Screen; }) => {
  const navItems = [
    { id: 'dashboard', icon: '🏠', label: 'Home' },
    { id: 'sketch', icon: '🎨', label: 'Sketch' },
    { id: 'visualizer', icon: '📂', label: 'Visualizer' },
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

export const Toolbar = ({ children }: { children: React.ReactNode }) => (
  <header className="flex items-center justify-between p-4 bg-white/50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700 rounded-t-lg">
    {children}
  </header>
);
