'use client';

import { useEffect, useState } from 'react';

interface ConfettiProps {
  trigger?: boolean;
  duration?: number;
}

interface Particle {
  id: number;
  x: number;
  y: number;
  color: string;
  rotation: number;
  velocity: {
    x: number;
    y: number;
    rotation: number;
  };
}

const NEON_COLORS = [
  '#00FFFF', // Cyber Cyan
  '#00D4FF', // Sky Blue  
  '#A259FF', // Electric Purple
  '#FF10F0', // Neon Pink
  '#CCFF00', // Acid Green
  '#FF69B4', // Hot Pink
];

export function Confetti({ trigger = false, duration = 3000 }: ConfettiProps) {
  const [particles, setParticles] = useState<Particle[]>([]);
  const [isActive, setIsActive] = useState(false);

  useEffect(() => {
    if (trigger && !isActive) {
      startConfetti();
    }
  }, [trigger]);

  const startConfetti = () => {
    setIsActive(true);
    
    // Create particles
    const newParticles: Particle[] = [];
    const particleCount = 50;

    for (let i = 0; i < particleCount; i++) {
      newParticles.push({
        id: i,
        x: Math.random() * 100,
        y: -10,
        color: NEON_COLORS[Math.floor(Math.random() * NEON_COLORS.length)],
        rotation: Math.random() * 360,
        velocity: {
          x: (Math.random() - 0.5) * 4,
          y: Math.random() * 3 + 2,
          rotation: (Math.random() - 0.5) * 10
        }
      });
    }

    setParticles(newParticles);

    // Clear after duration
    setTimeout(() => {
      setParticles([]);
      setIsActive(false);
    }, duration);
  };

  if (particles.length === 0) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-[9999] overflow-hidden">
      {particles.map((particle) => (
        <div
          key={particle.id}
          className="absolute w-3 h-3 animate-confetti-fall"
          style={{
            left: `${particle.x}%`,
            top: `${particle.y}%`,
            backgroundColor: particle.color,
            transform: `rotate(${particle.rotation}deg)`,
            boxShadow: `0 0 10px ${particle.color}`,
            animation: `confetti-fall ${duration}ms linear forwards`,
            '--confetti-x': `${particle.velocity.x}vw`,
            '--confetti-y': `${particle.velocity.y * 30}vh`,
            '--confetti-rotation': `${particle.velocity.rotation * 360}deg`
          } as React.CSSProperties}
        />
      ))}
    </div>
  );
}

// Add confetti animation to globals.css
export const confettiStyles = `
  @keyframes confetti-fall {
    0% {
      transform: translateY(0) translateX(0) rotate(0deg);
      opacity: 1;
    }
    100% {
      transform: translateY(var(--confetti-y)) translateX(var(--confetti-x)) rotate(var(--confetti-rotation));
      opacity: 0;
    }
  }
  
  .animate-confetti-fall {
    animation: confetti-fall 3s linear forwards;
  }
`;
