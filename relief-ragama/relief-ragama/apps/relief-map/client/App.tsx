import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import MapPage from "./pages/Map";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<MapPage />} />
      </Routes>
    </BrowserRouter>
  );
}
