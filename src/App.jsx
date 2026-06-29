import { Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Home from './pages/Home';
import LiveTelemetry from './pages/LiveTelemetry';
import Calendar from './pages/Calendar';
import './styles/theme.css';
import './App.css';

function App() {
  return (
    <div className="app">
      <Navbar />
      <main>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/telemetry" element={<LiveTelemetry />} />
          <Route path="/calendar" element={<Calendar />} />
        </Routes>
      </main>
      <Footer />
    </div>
  );
}

export default App;
