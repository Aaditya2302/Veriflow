import React from 'react';
import { RouterProvider, Route } from './components/Router';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import History from './pages/History';

export default function App() {
  return (
    <RouterProvider>
      <div className="bg-gray-50 min-h-screen text-gray-900 flex flex-col font-sans">
        {/* Navigation Bar */}
        <Navbar />

        {/* Views Router Wrapper */}
        <main className="flex-grow">
          {/* Home View */}
          <Route path="/">
            <Home />
          </Route>

          {/* History Log View */}
          <Route path="/history">
            <History />
          </Route>
        </main>
      </div>
    </RouterProvider>
  );
}
