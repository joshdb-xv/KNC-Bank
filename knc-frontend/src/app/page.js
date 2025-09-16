"use client";

import Link from 'next/link';
import React, { useEffect, useState } from 'react';

export default function Landing() {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };

    window.addEventListener('mousemove', handleMouseMove);
    
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, []);

  // Calculate color intensity based on mouse position
  const colorIntensity = Math.min((mousePosition.x + mousePosition.y) / 2000, 1);
  const gridColor = `hsl(${120 + colorIntensity * 60}, 70%, ${50 + colorIntensity * 20}%)`;

  return (
    <div className="min-h-screen relative overflow-hidden bg-white">
      {/* Grid background */}
      <div 
        className="absolute inset-0 opacity-30"
        style={{
          backgroundImage: `linear-gradient(${gridColor} 2px, transparent 2px), linear-gradient(90deg, ${gridColor} 2px, transparent 2px)`,
          backgroundSize: '80px 80px',
          transform: `translate(${mousePosition.x * 0.02}px, ${mousePosition.y * 0.02}px)`,
          transition: 'background-image 0.3s ease'
        }}
      />

      {/* Content */}
      <div className="relative z-10 min-h-screen flex flex-col items-center justify-center px-6">
        <h1 className="text-9xl font-bold text-center mb-4 text-primary">
          KNC Bank
        </h1>
        <h1 className="text-6xl font-extrabold text-center mb-4 text-primary-light leading-relaxed">
          Money moves. You lead.
        </h1>
        
        <p className="text-xl text-center font-medium max-w-xl mb-8 text-black tracking-wide leading-relaxed">
          Built for people who like control without the confusion. Deposit, withdraw, track — your money, your rules.
        </p>
        
        <div className="flex space-x-4">
          <Link href="/auth/login" className="px-12 py-3 rounded-xl text-xl font-semibold bg-primary text-orange-50 hover:bg-primary-light hover:scale-105 transition-all duration-200 cursor-pointer">
            Get Started
          </Link>
        </div>
      </div>
    </div>
  );
}