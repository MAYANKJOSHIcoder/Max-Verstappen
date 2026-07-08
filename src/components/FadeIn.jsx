import { useRef, useState, useEffect, createElement } from 'react';

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

const EASE = 'cubic-bezier(0.22, 1, 0.36, 1)';

const FadeIn = ({
  children,
  delay = 0,
  duration = 0.6,
  y,
  x,
  scale,
  scaleY,
  rootMargin,
  className,
  style,
  as = 'div',
  ...rest
}) => {
  const [ref, inView] = useInView(rootMargin);
  const prefersReduced = typeof window !== 'undefined'
    && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const visible = prefersReduced || inView;

  let fromTransform = '';
  if (y != null) fromTransform += `translateY(${y}px)`;
  if (x != null) fromTransform += ` translateX(${x}px)`;
  if (scale != null) fromTransform += ` scale(${scale})`;
  if (scaleY != null) fromTransform += ` scaleY(${scaleY})`;
  if (!fromTransform) fromTransform = 'none';

  const currentStyle = visible
    ? { opacity: 1, transform: 'none' }
    : { opacity: 0, transform: fromTransform };

  const transition = visible
    ? `opacity ${duration}s ${EASE} ${delay}s, transform ${duration}s ${EASE} ${delay}s`
    : 'none';

  return createElement(as, {
    ref,
    className,
    style: { ...style, ...currentStyle, transition },
    ...rest,
  }, children);
};

export default FadeIn;
