import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.less';
import App from './App';
import { BrowserRouter } from "react-router-dom";
import { ScrollToTop } from './Utils';
import { AuthProvider } from './auth/AuthProvider';

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);
root.render(
  <React.StrictMode>
    <AuthProvider>
      <BrowserRouter>
        <ScrollToTop />
        <App />
      </BrowserRouter>
    </AuthProvider>
  </React.StrictMode>
);