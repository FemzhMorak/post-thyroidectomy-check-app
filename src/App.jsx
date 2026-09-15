import { useState } from 'react';
import { Routes, Route } from 'react-router-dom';
import Home from './pages/Home.jsx';
import Background from './components/Background.jsx';

export default function App() {
  const [dx, setDx] = useState(null);

  return (
    <>
      <Background dx={dx} />
      <Routes>
        <Route path="/" element={<Home onDxChange={setDx} />} />
      </Routes>
    </>
  );
}
