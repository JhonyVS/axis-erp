import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';

// The ONLY stylesheet the app imports. Anything else under src/ that looks like a
// stylesheet is dead code — keep it that way, or the next person will spend an afternoon
// editing a file that nothing loads.
import './styles/globals.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    {/* Opting in now keeps the console clean and makes the v7 upgrade a no-op. */}
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <App />
    </BrowserRouter>
  </React.StrictMode>
);
