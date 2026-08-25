import React, { useEffect, useRef } from 'react';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  baseRadius: number;
  color: string;
  alpha: number;
}

interface Pulse {
  startIndex: number;
  endIndex: number;
  progress: number;
  speed: number;
}

export const NeuralCanvasBackground: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    // Mouse coordinates with smoothing
    const mouse = {
      x: width / 2,
      y: height / 2,
      targetX: width / 2,
      targetY: height / 2,
      radius: 180,
      active: false
    };

    // Check reduced motion preference
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const particleCount = prefersReducedMotion ? 25 : Math.min(Math.floor((width * height) / 16000), 75);

    const particles: Particle[] = [];
    const pulses: Pulse[] = [];
    const colors = ['#ec4899', '#8b5cf6', '#38bdf8', '#06b6d4'];

    // Initialize particles
    for (let i = 0; i < particleCount; i++) {
      const radius = Math.random() * 2 + 1.2;
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.45,
        vy: (Math.random() - 0.5) * 0.45,
        radius,
        baseRadius: radius,
        color: colors[Math.floor(Math.random() * colors.length)],
        alpha: Math.random() * 0.5 + 0.3
      });
    }

    // Resize handler
    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };

    // Mouse move handler
    const handleMouseMove = (e: MouseEvent) => {
      mouse.targetX = e.clientX;
      mouse.targetY = e.clientY;
      mouse.active = true;
    };

    const handleMouseLeave = () => {
      mouse.active = false;
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseleave', handleMouseLeave);

    // Spawn electric pulses periodically
    const pulseInterval = setInterval(() => {
      if (particles.length > 2 && pulses.length < 4) {
        const startIndex = Math.floor(Math.random() * particles.length);
        let closestIndex = -1;
        let minDistance = 140;

        for (let j = 0; j < particles.length; j++) {
          if (startIndex === j) continue;
          const dx = particles[startIndex].x - particles[j].x;
          const dy = particles[startIndex].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < minDistance) {
            minDistance = dist;
            closestIndex = j;
          }
        }

        if (closestIndex !== -1) {
          pulses.push({
            startIndex,
            endIndex: closestIndex,
            progress: 0,
            speed: 0.035 + Math.random() * 0.02
          });
        }
      }
    }, 1800);

    // Main 60 FPS Render Loop
    const render = () => {
      // Smooth mouse easing
      mouse.x += (mouse.targetX - mouse.x) * 0.08;
      mouse.y += (mouse.targetY - mouse.y) * 0.08;

      // Dark futuristic gradient background
      const bgGradient = ctx.createRadialGradient(
        mouse.x,
        mouse.y,
        50,
        width / 2,
        height / 2,
        Math.max(width, height) * 0.8
      );
      bgGradient.addColorStop(0, '#0c1024');
      bgGradient.addColorStop(0.5, '#070a14');
      bgGradient.addColorStop(1, '#03050a');

      ctx.fillStyle = bgGradient;
      ctx.fillRect(0, 0, width, height);

      // Connect particles with neural lines
      const maxDistance = 130;
      for (let i = 0; i < particles.length; i++) {
        const p1 = particles[i];

        for (let j = i + 1; j < particles.length; j++) {
          const p2 = particles[j];
          const dx = p1.x - p2.x;
          const dy = p1.y - p2.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < maxDistance) {
            const lineAlpha = (1 - dist / maxDistance) * 0.22;
            ctx.beginPath();
            ctx.moveTo(p1.x, p1.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.strokeStyle = `rgba(139, 92, 246, ${lineAlpha})`;
            ctx.lineWidth = 0.8;
            ctx.stroke();
          }
        }
      }

      // Draw active electric pulses
      for (let k = pulses.length - 1; k >= 0; k--) {
        const pulse = pulses[k];
        const pStart = particles[pulse.startIndex];
        const pEnd = particles[pulse.endIndex];

        if (pStart && pEnd) {
          const currentX = pStart.x + (pEnd.x - pStart.x) * pulse.progress;
          const currentY = pStart.y + (pEnd.y - pStart.y) * pulse.progress;

          ctx.beginPath();
          ctx.arc(currentX, currentY, 2.5, 0, Math.PI * 2);
          ctx.fillStyle = '#38bdf8';
          ctx.shadowColor = '#38bdf8';
          ctx.shadowBlur = 10;
          ctx.fill();
          ctx.shadowBlur = 0;

          pulse.progress += pulse.speed;
          if (pulse.progress >= 1) {
            pulses.splice(k, 1);
          }
        } else {
          pulses.splice(k, 1);
        }
      }

      // Update and draw particles
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];

        // Organic gentle movement
        p.x += p.vx;
        p.y += p.vy;

        // Bounce on boundaries
        if (p.x < 0 || p.x > width) p.vx *= -1;
        if (p.y < 0 || p.y > height) p.vy *= -1;

        // Mouse Parallax & Attraction
        if (mouse.active) {
          const dx = mouse.x - p.x;
          const dy = mouse.y - p.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < mouse.radius) {
            const force = (1 - dist / mouse.radius) * 0.4;
            p.x += (dx / dist) * force * 1.5;
            p.y += (dy / dist) * force * 1.5;
            p.radius = p.baseRadius * 1.4;
          } else {
            p.radius += (p.baseRadius - p.radius) * 0.05;
          }
        }

        // Draw particle with glow
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.alpha;
        ctx.fill();
        ctx.globalAlpha = 1.0;
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
      clearInterval(pulseInterval);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        zIndex: 0,
        pointerEvents: 'none',
        opacity: 0.85
      }}
    />
  );
};
