import { useState, useEffect } from 'react';
import './Navbar.css';

const links = [
  { id: 'highlights', label: 'Title runs' },
  { id: 'telemetry', label: 'Live Telemetry' },
  { id: 'calendar', label: 'Calendar' },
  { id: 'cars', label: 'Cars' },
  { id: 'journey', label: 'Journey' },
  { id: 'records', label: 'Records' },
  { id: 'gallery', label: 'Gallery' },
];

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [hasScrolled, setHasScrolled] = useState(false);
  const [activeId, setActiveId] = useState('');

  // Track scroll position for the sticky nav style + clear active link
  // when the user returns to the top (hero has no matching link).
  useEffect(() => {
    const onScroll = () => {
      setHasScrolled(window.scrollY > 12);
      if (window.scrollY < 200) setActiveId('');
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Track which section is currently in view for the active state.
  // The hero (#top) has no matching link, so activeId stays '' until the
  // user scrolls past it.
  useEffect(() => {
    const sectionIds = links.map((l) => l.id);
    const observer = new IntersectionObserver(
      (entries) => {
        // Pick the topmost intersecting section
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
  }, []);

  const scrollTo = (id) => {
    setIsMenuOpen(false);
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <nav className={`navbar ${hasScrolled ? 'navbar--scrolled' : ''}`}>
      <div className="navbar-inner">
        <button
          className="navbar-brand"
          aria-label="Max Verstappen — back to top"
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        >
          <span className="brand-name">Max Verstappen</span>
          <span className="brand-tag">4× World Champion</span>
        </button>

        <ul className={`navbar-links ${isMenuOpen ? 'is-open' : ''}`}>
          {links.map((l) => (
            <li key={l.id}>
              <button
                className={`nav-link ${activeId === l.id ? 'is-active' : ''}`}
                onClick={() => scrollTo(l.id)}
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
