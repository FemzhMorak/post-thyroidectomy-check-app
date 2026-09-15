import { useState } from 'react';
import { Routes, Route } from 'react-router-dom';
import Home from './pages/Home.jsx';
import Background from './components/Background.jsx';
import Onboarding from './components/Onboarding.jsx';
import { getProfile } from './utils/profile.js';

export default function App() {
  const [dx, setDx] = useState(null);
  const [profile, setProfile] = useState(() => getProfile());

  return (
    <>
      <Background dx={dx} />
      <Routes>
        <Route path="/" element={<Home onDxChange={setDx} profile={profile} />} />
      </Routes>
      {!profile && <Onboarding onComplete={setProfile} />}
    </>
  );
}
