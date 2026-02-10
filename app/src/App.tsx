import { motion } from 'framer-motion';
import { useEffect, useRef, useState } from 'react';
import { RouterProvider } from '@tanstack/react-router';
import voiceboxLogo from '@/assets/voicebox-logo.png';
import ShinyText from '@/components/ShinyText';
import { TitleBarDragRegion } from '@/components/TitleBarDragRegion';
import { TOP_SAFE_AREA_PADDING } from '@/lib/constants/ui';
import {
  isTauri,
  setKeepServerRunning,
  setupWindowCloseHandler,
  startServer,
} from '@/lib/tauri';
import { cn } from '@/lib/utils/cn';
import { router } from '@/router';
import { useServerStore } from '@/stores/serverStore';

const LOADING_MESSAGES = [
  'Warming up tensors...',
  'Calibrating synthesizer engine...',
  'Initializing voice models...',
  'Loading neural networks...',
  'Preparing audio pipelines...',
  'Optimizing waveform generators...',
  'Tuning frequency analyzers...',
  'Building voice embeddings...',
  'Configuring text-to-speech cores...',
  'Syncing audio buffers...',
  'Establishing model connections...',
  'Preprocessing training data...',
  'Validating voice samples...',
  'Compiling inference engines...',
  'Mapping phoneme sequences...',
  'Aligning prosody parameters...',
  'Activating speech synthesis...',
  'Fine-tuning acoustic models...',
  'Preparing voice cloning matrices...',
  'Initializing Qwen TTS framework...',
];

function App() {
  const [serverReady, setServerReady] = useState(false);
  const [loadingMessageIndex, setLoadingMessageIndex] = useState(0);
  const serverStartingRef = useRef(false);

  // Sync stored setting to Rust on startup
  useEffect(() => {
    if (isTauri()) {
      const keepRunning = useServerStore.getState().keepServerRunningOnClose;
      setKeepServerRunning(keepRunning).catch((error) => {
        console.error('Failed to sync initial setting to Rust:', error);
      });
    }
  }, []);

  // Setup window close handler and auto-start server when running in Tauri (production only)
  useEffect(() => {
    if (!isTauri()) {
      return;
    }

    // Setup window close handler to check setting and stop server if needed
    // This works in both dev and prod, but will only stop server if it was started by the app
    setupWindowCloseHandler().catch((error) => {
      console.error('Failed to setup window close handler:', error);
    });

    const serviceMode = useServerStore.getState().serviceMode;

    // Only auto-start server in production mode unless service mode is enabled
    // In dev mode, user runs server separately unless service mode is explicitly turned on
    if (!import.meta.env?.PROD && !serviceMode) {
      console.log('Dev mode: Skipping auto-start of server (run it separately)');
      setServerReady(true); // Mark as ready so UI doesn't show loading screen
      // Mark that server was not started by app (so we don't try to stop it on close)
      // @ts-ignore - adding property to window
      window.__voiceboxServerStartedByApp = false;
      return;
    }

    // Auto-start server in production
    if (serverStartingRef.current) {
      return;
    }

    serverStartingRef.current = true;
    console.log('Production mode: Starting bundled server...');

    startServer(false)
      .then((serverUrl) => {
        console.log('Server is ready at:', serverUrl);
        // Update the server URL in the store with the dynamically assigned port
        useServerStore.getState().setServerUrl(serverUrl);
        setServerReady(true);
        // Mark that we started the server (so we know to stop it on close)
        window.__voiceboxServerStartedByApp = true;
      })
      .catch((error) => {
        console.error('Failed to auto-start server:', error);
        serverStartingRef.current = false;
        window.__voiceboxServerStartedByApp = false;
      });

    // Cleanup: stop server on actual unmount (not StrictMode remount)
    // Note: Window close is handled separately in Tauri Rust code
    return () => {
      // Window close event handles server shutdown based on setting
      serverStartingRef.current = false;
    };
  }, []);

  // Cycle through loading messages every 3 seconds
  useEffect(() => {
    if (!isTauri() || serverReady) {
      return;
    }

    const interval = setInterval(() => {
      setLoadingMessageIndex((prev) => (prev + 1) % LOADING_MESSAGES.length);
    }, 3000);

    return () => clearInterval(interval);
  }, [serverReady]);

  // Show loading screen while server is starting in Tauri
  if (isTauri() && !serverReady) {
    return (
      <div
        className={cn(
          'min-h-screen bg-background flex flex-col items-center justify-center relative overflow-hidden',
          TOP_SAFE_AREA_PADDING,
        )}
      >
        <TitleBarDragRegion />
        
        {/* Grid Background */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-size-[24px_24px] pointer-events-none" />
        <div className="absolute inset-0 bg-radial-gradient(circle_at_center,transparent_0%,bg-background_100%) pointer-events-none" />

        <div className="z-10 flex flex-col items-center max-w-md w-full px-6">
           {/* Logo with Orbital effects */}
           <div className="relative mb-12">
              <motion.div 
                className="absolute -inset-5 rounded-full border border-primary/20"
                animate={{ rotate: 360 }}
                transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
              />
              <motion.div 
                className="absolute -inset-7.5 rounded-full border border-dashed border-primary/10"
                animate={{ rotate: -360 }}
                transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
              />
              <div className="absolute inset-0 bg-primary/10 blur-3xl rounded-full animate-pulse" />
              
              <img
                src={voiceboxLogo}
                alt="Voicebox"
                className="w-32 h-32 object-contain relative z-10 drop-shadow-[0_0_30px_rgba(124,58,237,0.4)]"
              />
           </div>

           {/* Technical Loader */}
           <div className="w-full space-y-4 font-mono">
              <div className="flex justify-between text-[10px] text-primary/60 uppercase tracking-[0.2em]">
                 <span>System_Check</span>
                 <span className="animate-pulse">Active</span>
              </div>
              
              <div className="relative h-1 w-full bg-white/5 rounded-full overflow-hidden">
                  <motion.div 
                     className="absolute inset-y-0 left-0 bg-primary shadow-[0_0_10px_rgba(124,58,237,0.8)]"
                     initial={{ width: "0%", left: "0%" }}
                     animate={{ width: ["0%", "50%", "100%"], left: ["0%", "25%", "100%"] }}
                     transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                  />
              </div>
              
              <div className="h-6 flex items-center justify-center">
                  <ShinyText
                    text={`> ${LOADING_MESSAGES[loadingMessageIndex]}`}
                    className="text-xs text-muted-foreground/80"
                    speed={2}
                    shineColor="hsl(var(--primary))"
                  />
              </div>
           </div>
        </div>
      </div>
    );
  }

  return <RouterProvider router={router} />;
}

export default App;
