import { Routes, Route } from 'react-router-dom';
import Home from './pages/Home.jsx';
import Background from './components/Background.jsx';

export default function App() {
  return (
    <>
      <Background />
      <Routes>
        <Route path="/" element={<Home />} />
      </Routes>
    </>
  );
}
