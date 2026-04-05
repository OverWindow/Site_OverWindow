import React from "react";

import { BrowserRouter, Routes, Route } from "react-router-dom";
import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import Sites from './pages/Sites.jsx'
import './index.css'

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<App />} />
        <Route path="/sites" element={<Sites />} />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
)
