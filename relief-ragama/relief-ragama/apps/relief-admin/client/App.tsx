import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Toaster } from "./components/Toast";
import { Nav } from "./components/Nav";
import { AuthGate } from "./components/AuthGate";
import { RequireAdmin } from "./components/RequireAdmin";
import { I18nProvider } from "./i18n";
import HomePage from "./pages/Home";
import DataEntry from "./pages/DataEntry";
import Dashboard from "./pages/Dashboard";
import UsersPage from "./pages/Users";

export default function App() {
  return (
    <I18nProvider>
      <BrowserRouter>
        <Toaster />
        <AuthGate>
          <div className="min-h-dvh bg-background flex flex-col pb-14 md:pb-0">
            <Nav />
            <main className="flex-1">
              <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/entry" element={<DataEntry />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route
                  path="/users"
                  element={
                    <RequireAdmin>
                      <UsersPage />
                    </RequireAdmin>
                  }
                />
              </Routes>
            </main>
          </div>
        </AuthGate>
      </BrowserRouter>
    </I18nProvider>
  );
}
