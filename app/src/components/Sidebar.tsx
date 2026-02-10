import { Link, useMatchRoute, useLocation } from '@tanstack/react-router';
import { Box, BookOpen, Loader2, Mic, Server, Speaker, Volume2 } from 'lucide-react';
import voiceboxLogo from '@/assets/voicebox-logo.png';
import { cn } from '@/lib/utils/cn';
import { useGenerationStore } from '@/stores/generationStore';
import { usePlayerStore } from '@/stores/playerStore';
import { motion } from 'framer-motion';

interface SidebarProps {
  isMacOS?: boolean;
}

const tabs = [
  { id: 'main', path: '/', icon: Volume2, label: 'Generate' },
  { id: 'stories', path: '/stories', icon: BookOpen, label: 'Stories' },
  { id: 'voices', path: '/voices', icon: Mic, label: 'Voices' },
  { id: 'audio', path: '/audio', icon: Speaker, label: 'Audio' },
  { id: 'models', path: '/models', icon: Box, label: 'Models' },
  { id: 'server', path: '/server', icon: Server, label: 'Server' },
];

export function Sidebar({ isMacOS }: SidebarProps) {
  const isGenerating = useGenerationStore((state) => state.isGenerating);
  const audioUrl = usePlayerStore((state) => state.audioUrl);
  const isPlayerVisible = !!audioUrl;
  const matchRoute = useMatchRoute();
  const location = useLocation();

  return (
    <motion.div
      initial={{ x: -100, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      className={cn(
        'fixed left-4 top-4 bottom-4 w-20 z-50 rounded-2xl flex flex-col items-center py-6 gap-6',
        'bg-background/40 backdrop-blur-2xl border border-white/10 shadow-2xl shadow-black/50',
        isMacOS && 'top-12', // Adjustment for macOS title bar
      )}
    >
      {/* Logo */}
      <div className="mb-4 relative group cursor-pointer">
        <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        <img
          src={voiceboxLogo}
          alt="Voicebox"
          className="w-12 h-12 object-contain relative z-10 drop-shadow-[0_0_15px_rgba(124,58,237,0.5)] transition-transform duration-300 group-hover:scale-110"
        />
      </div>

      {/* Navigation Buttons */}
      <nav className="flex flex-col gap-4 w-full px-3">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive =
            tab.path === '/'
              ? matchRoute({ to: '/' }) !== false && location.pathname === '/'
              : matchRoute({ to: tab.path });

          return (
            <Link
              key={tab.id}
              to={tab.path}
              className="relative group w-full aspect-square flex items-center justify-center"
              title={tab.label}
            >
              {isActive && (
                <motion.div
                  layoutId="sidebar-active"
                  className="absolute inset-0 bg-primary/20 border border-primary/30 rounded-xl shadow-[0_0_20px_inset_rgba(124,58,237,0.2)]"
                  transition={{ type: 'spring', duration: 0.6 }}
                />
              )}

              <div
                className={cn(
                  'relative z-10 transition-all duration-300',
                  isActive
                    ? 'text-primary drop-shadow-[0_0_8px_rgba(124,58,237,0.5)]'
                    : 'text-muted-foreground group-hover:text-foreground group-hover:scale-110',
                )}
              >
                <Icon className="h-6 w-6" strokeWidth={isActive ? 2.5 : 2} />
              </div>

              {!isActive && (
                <div className="absolute inset-0 rounded-xl bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Generation Loader */}
      {isGenerating && (
        <div
          className={cn(
            'w-full flex items-center justify-center pb-4',
            isPlayerVisible ? 'mb-24' : 'mb-0',
          )}
        >
          <div className="relative">
            <div className="absolute inset-0 bg-accent/20 blur-lg rounded-full animate-pulse" />
            <Loader2 className="h-6 w-6 text-accent animate-spin relative z-10" />
          </div>
        </div>
      )}
    </motion.div>
  );
}
