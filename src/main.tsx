import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { AppUIProvider } from './state/AppUIContext';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AppUIProvider>
      <App />
    </AppUIProvider>
  </StrictMode>,
);
