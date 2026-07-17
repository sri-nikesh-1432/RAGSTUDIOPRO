import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { ErrorBoundary } from './components/ErrorBoundary';
import Layout from './components/Layout';
import LandingPage from './pages/LandingPage';
import LearningCenter from './pages/LearningCenter';
import Playground from './pages/Playground';
import RAGBuilder from './pages/RAGBuilder';
import Analytics from './pages/Analytics';
import ModelManager from './pages/ModelManager';
import MCPPage from './pages/MCPPage';

export default function App() {
  return (
    <ErrorBoundary>
    <BrowserRouter>
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: '#1a1a26',
            color: '#f1f5f9',
            border: '1px solid rgba(255,255,255,0.05)',
          },
        }}
      />
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<LandingPage />} />
          <Route path="/learn" element={<LearningCenter />} />
          <Route path="/playground" element={<Playground />} />
          <Route path="/builder" element={<RAGBuilder />} />
          <Route path="/analytics" element={<Analytics />} />
          <Route path="/models" element={<ModelManager />} />
          <Route path="/mcp" element={<MCPPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
    </ErrorBoundary>
  );
}
