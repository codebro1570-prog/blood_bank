/**
 * Application Layout Shell
 * Includes the sticky top navigation header and content outlet.
 */

import React from 'react';
import { Outlet } from 'react-router-dom';
import { Header } from './Header';

export const Layout: React.FC = () => {
  return (
    <div className="min-h-screen bg-[#FBFBFA] flex flex-col selection:bg-[#B3203A]/10 selection:text-[#B3203A]">
      <Header />
      <main className="flex-1 w-full pb-12" id="main-content">
        <Outlet />
      </main>
      <footer className="border-t border-neutral-200/80 bg-white py-4 px-4 text-center text-xs text-neutral-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <p>© 2026 Blood Line. Unified Blood Banking Network.</p>
          <div className="flex items-center gap-4 text-neutral-600 font-medium">
            <span>Every donor is a hero</span>
            <span>·</span>
            <span className="text-[#B3203A]">Emergency Helpline: 108 / 104</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Layout;
