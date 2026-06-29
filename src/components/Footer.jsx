import { useNavigate } from 'react-router-dom';
import './Footer.css';

const navLinks = [
  { id: 'telemetry', label: 'Live Telemetry', route: '/telemetry' },
  { id: 'calendar', label: '2026 Calendar', route: '/calendar' },
  { id: 'highlights', label: 'Title Runs' },
  { id: 'cars', label: 'Cars' },
  { id: 'journey', label: 'Journey' },
  { id: 'records', label: 'Records' },
  { id: 'gallery', label: 'Gallery' },
];

const Footer = () => {
  const navigate = useNavigate();

  const handleClick = (link) => {
    if (link.route) {
      navigate(link.route);
    } else {
      navigate('/');
      setTimeout(() => {
        const el = document.getElementById(link.id);
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    }
  };

  return (
    <footer className="footer">
      <div className="footer-inner">
        <div className="footer-top">
          <div className="footer-brand">
            <span className="brand-number" aria-hidden="true">33</span>
            <div>
              <p className="footer-title">Max Verstappen</p>
              <p className="footer-sub">Unofficial fan site</p>
            </div>
          </div>

          <div className="footer-cols">
            <div className="footer-col">
              <h4>Explore</h4>
              <ul>
                {navLinks.map((l) => (
                  <li key={l.id}>
                    <button
                      className="footer-link"
                      onClick={() => handleClick(l)}
                    >
                      {l.label}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
            <div className="footer-col">
              <h4>Sources</h4>
              <p>
                All images sourced from the official Formula 1 and Red Bull
                Racing media libraries, used under fair use for non-commercial
                fan purposes.
              </p>
            </div>
          </div>
        </div>

        <div className="footer-bottom">
          <p>
            © {new Date().getFullYear()} Max Verstappen Fan Site · This is an
            unofficial fan project, not affiliated with Formula 1 or Red Bull
            Racing.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
