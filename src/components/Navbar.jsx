import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import './Navbar.css';

const links = [
  { id: 'telemetry', label: 'Live Telemetry', route: '/telemetry' },
  { id: 'calendar', label: 'Calendar', route: '/calendar' },
  { id: 'highlights', label: 'Title Runs' },
  { id: 'cars', label: 'Cars' },
  { id: 'journey', label: 'Journey' },
  { id: 'records', label: 'Records' },
  { id: 'gallery', label: 'Gallery' },
];

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [hasScrolled, setHasScrolled] = useState(false);
  const [activeId, setActiveId] = useState('');
  const location = useLocation();
  const navigate = useNavigate();

  // Track scroll position for the sticky nav style + clear active link
  // when the user returns to the top (hero has no matching link).
  useEffect(() => {
    const onScroll = () => {
      const next = window.scrollY > 12;
      setHasScrolled((prev) => (prev === next ? prev : next));
      if (window.scrollY < 200) setActiveId('');
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Route-based active state: if on /telemetry or /calendar, set activeId.
  // Otherwise, fall back to scroll-based detection via IntersectionObserver.
  useEffect(() => {
    if (location.pathname === '/telemetry') {
      setActiveId('telemetry');
      return;
    }
    if (location.pathname === '/calendar') {
      setActiveId('calendar');
      return;
    }

    // On home (/) — use IntersectionObserver for scroll sections
    const sectionIds = links.map((l) => l.id);
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible.length > 0) {
          setActiveId(visible[0].target.id);
        }
      },
      {
        rootMargin: '-40% 0px -55% 0px',
        threshold: 0,
      }
    );
    sectionIds.forEach((id) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, [location.pathname]);

  const scrollToSection = (id) => {
    const el = document.getElementById(id);
    if (!el) return;
    const NAV_HEIGHT = 72;
    const top = el.getBoundingClientRect().top + window.scrollY - NAV_HEIGHT;
    window.scrollTo({ top, behavior: 'smooth' });
  };

  const handleNavigate = (link) => {
    setIsMenuOpen(false);
    if (link.route) {
      navigate(link.route);
    } else {
      if (location.pathname !== '/') {
        navigate('/');
        setTimeout(() => scrollToSection(link.id), 100);
      } else {
        scrollToSection(link.id);
      }
    }
  };

  return (
    <nav className={`navbar ${hasScrolled ? 'navbar--scrolled' : ''}`}>
      <div className="navbar-inner">
        <button
          className="navbar-brand"
          aria-label="Max Verstappen — back to top"
          onClick={() => {
            if (location.pathname === '/') {
              window.scrollTo({ top: 0, behavior: 'smooth' });
            } else {
              navigate('/');
            }
          }}
        >
          <span className="brand-name">Max Verstappen</span>
          <span className="brand-tag">4× World Champion</span>
        </button>

        <ul className={`navbar-links ${isMenuOpen ? 'is-open' : ''}`}>
          {links.map((l) => (
            <li key={l.id}>
              <button
                className={`nav-link ${activeId === l.id ? 'is-active' : ''}`}
                onClick={() => handleNavigate(l)}
              >
                {l.label}
              </button>
            </li>
          ))}
        </ul>

        <button
          className={`nav-toggle ${isMenuOpen ? 'is-open' : ''}`}
          onClick={() => setIsMenuOpen((v) => !v)}
          aria-label="Toggle navigation"
          aria-expanded={isMenuOpen}
        >
          <span /><span /><span />
        </button>
      </div>
    </nav>
  );
};

export default Navbar;
