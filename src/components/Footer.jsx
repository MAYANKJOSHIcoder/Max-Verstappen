import './Footer.css';

const navLinks = [
  { id: 'highlights', label: 'Title runs' },
  { id: 'telemetry', label: 'Live Telemetry' },
  { id: 'calendar', label: '2026 Calendar' },
  { id: 'cars', label: 'Red Bull Cars' },
  { id: 'journey', label: 'Career Journey' },
  { id: 'records', label: 'Records' },
  { id: 'gallery', label: 'Gallery' },
];

const Footer = () => {
  const handleClick = (id) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
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
                      onClick={() => handleClick(l.id)}
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
