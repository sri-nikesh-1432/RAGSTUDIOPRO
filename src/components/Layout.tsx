import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BookOpen, Brain, BarChart3, Cpu, FileText,
  Home, ChevronLeft, ChevronRight, Zap,
} from 'lucide-react';
import { useState } from 'react';
import { cn } from '../lib/utils';

const navItems = [
  { path: '/', icon: Home, label: 'Home', description: 'Learn RAG from scratch' },
  { path: '/learn', icon: BookOpen, label: 'Learning Center', description: 'Interactive tutorials' },
  { path: '/playground', icon: Brain, label: 'Playground', description: 'Experiment with concepts' },
  { path: '/analytics', icon: BarChart3, label: 'Analytics', description: 'Performance metrics' },
  { path: '/models', icon: Cpu, label: 'Models', description: 'Manage AI models' },
  { path: '/docs', icon: FileText, label: 'Documentation', description: 'RAG concepts & guides' },
];

export default function Layout() {
  const location = useLocation();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="h-screen flex flex-col bg-bg-primary overflow-hidden">
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <motion.aside
          animate={{ width: collapsed ? 72 : 250 }}
          transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
          className="h-full border-r border-border-primary bg-bg-secondary/80 backdrop-blur-xl flex flex-col shrink-0"
        >
          {/* Logo */}
          <div className="h-14 flex items-center px-4 border-b border-border-primary">
            <div className="flex items-center gap-3 min-w-0">
              <motion.div
                whileHover={{ rotate: 10, scale: 1.05 }}
                className="w-9 h-9 rounded-xl bg-gradient-to-br from-accent-primary to-accent-dim flex items-center justify-center shrink-0 glow-sm"
              >
                <Zap className="w-4.5 h-4.5 text-white" style={{ width: 18, height: 18 }} />
              </motion.div>
              {!collapsed && (
                <motion.div
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  className="min-w-0"
                >
                  <div className="text-sm font-bold text-text-primary truncate">RAG Studio</div>
                  <div className="text-[10px] text-accent-secondary font-medium truncate">Pro v1.0</div>
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
                      : 'text-text-secondary hover:text-text-primary hover:bg-bg-hover'
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
                    isActive ? 'text-accent-primary' : 'text-text-tertiary group-hover:text-text-secondary'
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

          {/* Collapse Toggle */}
          <div className="p-2.5 border-t border-border-primary">
            <button
              onClick={() => setCollapsed(!collapsed)}
              className="w-full flex items-center justify-center gap-2 py-2 rounded-xl text-text-tertiary hover:text-text-secondary hover:bg-bg-hover transition-all duration-200"
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
