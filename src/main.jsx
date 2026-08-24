import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.jsx';
import { theme } from './theme.js';

document.body.style.margin = '0';
document.body.style.background = theme.color.paper;
document.body.style.fontFamily = theme.font.sans;
document.body.style.color = theme.color.ink;

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
