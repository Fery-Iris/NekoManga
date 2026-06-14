'use client';

import { useEffect, useRef } from 'react';
import { useTheme } from './ThemeProvider';

const TRAIL_LENGTH = 12;

interface TrailDot {
  x: number;
  y: number;
  age: number;
}

export default function MouseTrail() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const trailRef = useRef<TrailDot[]>([]);
  const mouseRef = useRef({ x: -100, y: -100 });
  const rafRef = useRef<number>(0);
  const { activeTheme } = useTheme();
  const accentRef = useRef(activeTheme.colors.primaryAccent);

  // Keep accent color in sync
  useEffect(() => {
    accentRef.current = activeTheme.colors.primaryAccent;
  }, [activeTheme]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    const handleMouse = (e: MouseEvent) => {
      mouseRef.current = { x: e.clientX, y: e.clientY };
    };
    window.addEventListener('mousemove', handleMouse);

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const trail = trailRef.current;
      const { x, y } = mouseRef.current;

      // Only add dots when mouse is on screen
      if (x > 0 && y > 0) {
        trail.unshift({ x, y, age: 0 });
      }

      // Limit trail length
      while (trail.length > TRAIL_LENGTH) {
        trail.pop();
      }

      // Draw trail
      for (let i = trail.length - 1; i >= 0; i--) {
        const dot = trail[i];
        dot.age++;

        const progress = i / TRAIL_LENGTH;
        const size = Math.max(2, (1 - progress) * 8);
        const opacity = Math.max(0, (1 - progress) * 0.5);

        // Parse accent hex to rgb
        const hex = accentRef.current.replace('#', '');
        const r = parseInt(hex.substring(0, 2), 16);
        const g = parseInt(hex.substring(2, 4), 16);
        const b = parseInt(hex.substring(4, 6), 16);

        // Glow effect
        ctx.beginPath();
        ctx.arc(dot.x, dot.y, size + 4, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${opacity * 0.15})`;
        ctx.fill();

        // Core dot
        ctx.beginPath();
        ctx.arc(dot.x, dot.y, size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${opacity})`;
        ctx.fill();
      }

      rafRef.current = requestAnimationFrame(animate);
    };

    rafRef.current = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener('resize', resize);
      window.removeEventListener('mousemove', handleMouse);
      cancelAnimationFrame(rafRef.current);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="mouse-trail-canvas"
      aria-hidden="true"
    />
  );
}
