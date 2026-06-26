import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Home from './pages/Home';
import './styles/theme.css';
import './App.css';

function App() {
  return (
    <div className="app">
      <Navbar />
      <main>
        <Home />
      </main>
      <Footer />
    </div>
  );
}

export default App
