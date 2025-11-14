import { useRef, useState, useEffect } from 'react';

export interface WaterServiceCardProps {
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string; size?: number; strokeWidth?: number }>;
  ctaText?: string;
  onClick?: () => void;
  gradientColors?: [string, string];
  waterDropColor?: string;
  index?: number;
}

export const WaterServiceCard: React.FC<WaterServiceCardProps> = ({
  title,
  description,
  icon: Icon,
  ctaText = "Continuar",
  onClick,
  gradientColors = ['#ff6b6b', '#d63031'],
  waterDropColor = 'rgba(255, 107, 107, 0.6)',
  index = 0
}) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), index * 100);
    return () => clearTimeout(timer);
  }, [index]);
  
  const handleWaterAnimation = (e: React.MouseEvent<HTMLButtonElement>) => {
    const card = cardRef.current;
    if (!card) return;
    
    // Crear gotas de agua
    for (let i = 0; i < 8; i++) {
      const drop = document.createElement('div');
      drop.className = 'waterDrop';
      drop.style.cssText = `
        position: absolute;
        width: 8px;
        height: 8px;
        border-radius: 50%;
        left: ${Math.random() * 100}%;
        animation: waterFall 2s ease-in forwards;
        animation-delay: ${Math.random() * 0.3}s;
        background: ${waterDropColor};
        pointer-events: none;
        z-index: 0;
      `;
      card.appendChild(drop);
      setTimeout(() => drop.remove(), 2000);
    }
    
    // Efecto ripple en el botón
    const rect = e.currentTarget.getBoundingClientRect();
    const cardRect = card.getBoundingClientRect();
    const x = rect.left - cardRect.left + rect.width / 2;
    const y = rect.top - cardRect.top + rect.height / 2;
    
    const ripple = document.createElement('div');
    ripple.className = 'waterRipple';
    ripple.style.cssText = `
      position: absolute;
      border: 2px solid ${gradientColors[0]};
      border-radius: 50%;
      animation: waterRipple 0.8s ease-out;
      left: ${x}px;
      top: ${y}px;
      pointer-events: none;
    `;
    card.appendChild(ripple);
    setTimeout(() => ripple.remove(), 800);
    
    if (onClick) onClick();
  };
  
  return (
    <div 
      className={`waterCard modern-card ${isVisible ? 'card-visible' : ''}`} 
      ref={cardRef}
      style={{
        animationDelay: `${index * 0.1}s`
      }}
    >
      {/* Efecto de brillo/glow */}
      <div 
        className="card-glow" 
        style={{
          background: `linear-gradient(135deg, ${gradientColors[0]} 0%, ${gradientColors[1]} 100%)`
        }}
      />
      
      <div className="card-content-wrapper">
        <div
          className="waterCardIconContainer modern-icon-container"
          style={{
            background: `linear-gradient(135deg, ${gradientColors[0]} 0%, ${gradientColors[1]} 100%)`
          }}
        >
          <Icon className="waterCardIcon modern-icon" size={32} strokeWidth={2} />
        </div>
        
        <div className="waterCardContent modern-card-text">
          <h3 className="waterCardTitle modern-card-title">{title}</h3>
          <p className="waterCardDescription modern-card-description">{description}</p>
        </div>
        
        <button
          className="waterCardButton modern-card-button"
          style={{
            background: `linear-gradient(135deg, ${gradientColors[0]} 0%, ${gradientColors[1]} 100%)`
          }}
          onClick={handleWaterAnimation}
        >
          <span>{ctaText}</span>
          <svg className="button-arrow" width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M6 12L10 8L6 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
      </div>
    </div>
  );
};