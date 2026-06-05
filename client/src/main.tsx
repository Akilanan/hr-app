import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { MotionConfig } from 'framer-motion';
import App from './App';
import { AuthProvider } from './auth/AuthContext';
import { BackdropGate } from './components/BackdropGate';
import { ConfirmProvider } from './components/ConfirmDialog';
import { ToastProvider } from './components/Toast';
import { initTheme } from './lib/theme';
import './styles.css';
import './styles/immersive.css';

initTheme();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <MotionConfig reducedMotion="user">
          <ConfirmProvider>
            <ToastProvider>
              <BackdropGate />
              <App />
            </ToastProvider>
          </ConfirmProvider>
        </MotionConfig>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>,
);
