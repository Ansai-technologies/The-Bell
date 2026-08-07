/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import AdminLayout from './layouts/AdminLayout';
import PublicArchive from './pages/PublicArchive';
import AdminDashboard from './pages/AdminDashboard';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AdminLayout />}>
          <Route path="/" element={<PublicArchive />} />
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/admin/subscribers" element={<div className="p-8 text-slate-500">Subscribers Page Coming Soon...</div>} />
          <Route path="/admin/pipeline" element={<div className="p-8 text-slate-500">Pipeline Health Page Coming Soon...</div>} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

