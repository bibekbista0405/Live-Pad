import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { AppUIProvider } from './state/AppUIContext';
import ErrorBoundary from './components/ErrorBoundary';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary fallbackTitle="LivePad Recovery">
      <AppUIProvider>
        <App />
      </AppUIProvider>
    </ErrorBoundary>
  </StrictMode>,
);
