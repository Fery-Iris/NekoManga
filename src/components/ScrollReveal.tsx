'use client';

import { useEffect, useRef, useState, CSSProperties, ReactNode } from 'react';

type AnimationType = 'fade-up' | 'fade-down' | 'fade-left' | 'fade-right' | 'zoom-in' | 'flip-up';

interface ScrollRevealProps {
  children: ReactNode;
  animation?: AnimationType;
  delay?: number;
  duration?: number;
  threshold?: number;
  once?: boolean;
  className?: string;
}

const ANIMATION_STYLES: Record<AnimationType, { from: CSSProperties; to: CSSProperties }> = {
  'fade-up': {
    from: { opacity: 0, transform: 'translateY(40px)' },
    to: { opacity: 1, transform: 'translateY(0)' },
  },
  'fade-down': {
    from: { opacity: 0, transform: 'translateY(-40px)' },
    to: { opacity: 1, transform: 'translateY(0)' },
  },
  'fade-left': {
    from: { opacity: 0, transform: 'translateX(-40px)' },
    to: { opacity: 1, transform: 'translateX(0)' },
  },
  'fade-right': {
    from: { opacity: 0, transform: 'translateX(40px)' },
    to: { opacity: 1, transform: 'translateX(0)' },
  },
  'zoom-in': {
    from: { opacity: 0, transform: 'scale(0.85)' },
    to: { opacity: 1, transform: 'scale(1)' },
  },
  'flip-up': {
    from: { opacity: 0, transform: 'perspective(600px) rotateX(20deg) translateY(30px)' },
    to: { opacity: 1, transform: 'perspective(600px) rotateX(0deg) translateY(0)' },
  },
};

export default function ScrollReveal({
  children,
  animation = 'fade-up',
  delay = 0,
  duration = 600,
  threshold = 0.1,
  once = true,
  className = '',
}: ScrollRevealProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          if (once) observer.unobserve(el);
        } else if (!once) {
          setIsVisible(false);
        }
      },
      { threshold, rootMargin: '0px 0px -50px 0px' }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [threshold, once]);

  const animStyle = ANIMATION_STYLES[animation];
  const style: CSSProperties = {
    ...(isVisible ? animStyle.to : animStyle.from),
    transition: `all ${duration}ms cubic-bezier(0.16, 1, 0.3, 1) ${delay}ms`,
    willChange: 'transform, opacity',
  };

  return (
    <div ref={ref} style={style} className={className}>
      {children}
    </div>
  );
}
