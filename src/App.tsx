import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { ErrorBoundary } from './components/ErrorBoundary';
import Layout from './components/Layout';
import LandingPage from './pages/LandingPage';
import RAGBuilder from './pages/RAGBuilder';
import Playground from './pages/Playground';
import ModelManager from './pages/ModelManager';
import Analytics from './pages/Analytics';
import LearningCenter from './pages/LearningCenter';
import Documentation from './pages/Documentation';

export default function App() {
  return (
    <ErrorBoundary>
    <BrowserRouter>
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: '#fdfcfa',
            color: '#1a1816',
            border: '1px solid #e8e0d4',
            fontFamily: 'Inter, system-ui, sans-serif',
            boxShadow: '0 4px 16px rgba(180, 132, 90, 0.1)',
          },
          success: {
            iconTheme: { primary: '#5a9e6f', secondary: '#fdfcfa' },
          },
          error: {
            iconTheme: { primary: '#c46060', secondary: '#fdfcfa' },
          },
        }}
      />
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<LandingPage />} />
          <Route path="/workspace" element={<RAGBuilder />} />
          <Route path="/playground" element={<Playground />} />
          <Route path="/models" element={<ModelManager />} />
          <Route path="/analytics" element={<Analytics />} />
          <Route path="/learn" element={<LearningCenter />} />
          <Route path="/docs" element={<Documentation />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
    </ErrorBoundary>
  );
}
