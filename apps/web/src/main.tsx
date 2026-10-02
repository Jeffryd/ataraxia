import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, HashRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { App, ErrorBoundary } from './app/App';
import { DatabaseProvider } from './storage/DatabaseProvider';
import './styles/global.css';
const queryClient = new QueryClient();
const Router = import.meta.env.DEV ? BrowserRouter : HashRouter;
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <Router>
          <DatabaseProvider>
            <App />
          </DatabaseProvider>
        </Router>
      </QueryClientProvider>
    </ErrorBoundary>
  </StrictMode>,
);
