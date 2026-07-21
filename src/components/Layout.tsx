import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Home, FileText, Layers3, ChevronLeft, ChevronRight, Sparkles,
  Brain, Cpu, BarChart3, BookOpen, Wifi, WifiOff,
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { cn } from '../lib/utils';
import { useAppStore } from '../store/appStore';
import { healthAPI } from '../services/api';

const navItems = [
  { path: '/', icon: Home, label: 'Home', description: 'RAG Studio Pro' },
  { path: '/workspace', icon: Layers3, label: 'Workspace', description: 'Build RAG pipelines' },
  { path: '/playground', icon: Brain, label: 'Playground', description: 'Experiment with RAG concepts' },
  { path: '/models', icon: Cpu, label: 'Models', description: 'Manage AI models' },
  { path: '/analytics', icon: BarChart3, label: 'Analytics', description: 'Pipeline & system metrics' },
  { path: '/learn', icon: BookOpen, label: 'Learning Center', description: 'Tutorials & guides' },
  { path: '/docs', icon: FileText, label: 'Documentation', description: 'Hybrid Multimodal RAG guides' },
];

export default function Layout() {
  const location = useLocation();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);
  const backendConnected = useAppStore(s => s.backendConnected);
  const setBackendConnected = useAppStore(s => s.setBackendConnected);

  // Check backend health on mount
  useEffect(() => {
    healthAPI.check()
      .then(() => setBackendConnected(true))
      .catch(() => setBackendConnected(false));
    // Check every 30s
    const interval = setInterval(() => {
      healthAPI.check()
        .then(() => setBackendConnected(true))
        .catch(() => setBackendConnected(false));
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="h-screen flex flex-col bg-bg-primary overflow-hidden">
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <motion.aside
          animate={{ width: collapsed ? 68 : 240 }}
          transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
          className="h-full border-r border-cream-300 bg-cream-50/80 backdrop-blur-sm flex flex-col shrink-0"
        >
          {/* Logo */}
          <div className="h-14 flex items-center px-4 border-b border-cream-300">
            <div className="flex items-center gap-3 min-w-0">
              <motion.div
                whileHover={{ rotate: 8, scale: 1.05 }}
                className="w-8 h-8 rounded-xl bg-gradient-to-br from-accent-primary to-accent-dim flex items-center justify-center shrink-0"
              >
                <Sparkles className="w-4 h-4 text-white" />
              </motion.div>
              {!collapsed && (
                <motion.div
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -8 }}
                  className="min-w-0"
                >
                  <div className="text-sm font-bold text-text-primary tracking-tight">RAG Studio</div>
                  <div className="text-[10px] text-accent-secondary font-medium">Pro</div>
                </motion.div>
              )}
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 py-4 px-2.5 space-y-1 overflow-y-auto">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <motion.button
                  key={item.path}
                  onClick={() => navigate(item.path)}
                  whileHover={{ x: 2 }}
                  whileTap={{ scale: 0.98 }}
                  className={cn(
                    'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group relative',
                    isActive
                      ? 'bg-accent-glow text-accent-secondary'
                      : 'text-text-secondary hover:text-text-primary hover:bg-cream-200/50'
                  )}
                >
                  {isActive && (
                    <motion.div
                      layoutId="activeNav"
                      className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-6 bg-accent-primary rounded-r-full"
                      transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
                    />
                  )}
                  <item.icon className={cn(
                    'shrink-0 transition-colors duration-200',
                    isActive ? 'text-accent-primary' : 'text-text-muted group-hover:text-text-secondary'
                  )} style={{ width: 18, height: 18 }} />
                  {!collapsed && (
                    <div className="min-w-0 text-left">
                      <div className="text-sm font-medium truncate">{item.label}</div>
                      <div className="text-[10px] text-text-muted truncate">{item.description}</div>
                    </div>
                  )}
                </motion.button>
              );
            })}
          </nav>

          {/* Backend Status */}
          <div className={cn(
            'px-2.5 pb-1 border-t border-cream-300',
            collapsed ? 'pt-3' : 'pt-2'
          )}>
            <div className={cn(
              'flex items-center gap-2 rounded-xl transition-all duration-200',
              collapsed ? 'justify-center py-2' : 'px-2.5 py-2'
            )}>
              <div className={cn(
                'w-2 h-2 rounded-full shrink-0',
                backendConnected ? 'bg-emerald-500 shadow-sm shadow-emerald-500/50 animate-pulse' : 'bg-red-400'
              )} />
              {!collapsed && (
                <div className="min-w-0">
                  <div className="text-[10px] font-medium text-text-secondary truncate flex items-center gap-1.5">
                    {backendConnected ? (
                      <><Wifi className="w-3 h-3 text-emerald-500" /> Backend Connected</>
                    ) : (
                      <><WifiOff className="w-3 h-3 text-red-400" /> Backend Offline</>
                    )}
                  </div>
                  <div className="text-[8px] text-text-muted">
                    {backendConnected ? 'localhost:8000' : 'Start backend with: python backend/start.py'}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Collapse Toggle */}
          <div className="p-2.5 border-t border-cream-300">
            <button
              onClick={() => setCollapsed(!collapsed)}
              className="w-full flex items-center justify-center gap-2 py-2 rounded-xl text-text-muted hover:text-text-secondary hover:bg-cream-200/50 transition-all duration-200"
            >
              {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
              {!collapsed && <span className="text-xs">Collapse</span>}
            </button>
          </div>
        </motion.aside>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto overflow-x-hidden">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
              className="min-h-full"
            >
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}
