import { useState, useEffect, useRef } from 'react';

const useInView = (rootMargin) => {
  const ref = useRef(null);
  const [inView, setInView] = useState(false);
  const marginRef = useRef(rootMargin);
  marginRef.current = rootMargin;

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          observer.unobserve(el);
        }
      },
      { threshold: 0, rootMargin: marginRef.current || '0px' }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return [ref, inView];
};

export default useInView;
