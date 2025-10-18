import { useRef } from 'react';

export interface WaterServiceCardProps {
  title: string;
  description: string;
  icon: React.ComponentType<{ className: string }>;
  ctaText?: string;
  onClick?: () => void;
  gradientColors?: [string, string];
  waterDropColor?: string;
}

export const WaterServiceCard: React.FC<WaterServiceCardProps> = ({
  title,
  description,
  icon: Icon,
  ctaText = "Continuar",
  onClick,
  gradientColors = ['#ff6b6b', '#d63031'],
  waterDropColor = 'rgba(255, 107, 107, 0.6)'
}) => {
  const cardRef = useRef<HTMLDivElement>(null);
  
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
    <div className="waterCard" ref={cardRef}>
      <div
        className="waterCardIconContainer"
        style={{
          background: `linear-gradient(135deg, ${gradientColors[0]} 0%, ${gradientColors[1]} 100%)`
        }}
      >
        <Icon className="waterCardIcon" />
      </div>
      <div className="waterCardContent">
        <h3 className="waterCardTitle">{title}</h3>
        <p className="waterCardDescription">{description}</p>
      </div>
      <button
        className="waterCardButton"
        style={{
          background: `linear-gradient(135deg, ${gradientColors[0]} 0%, ${gradientColors[1]} 100%)`
        }}
        onClick={handleWaterAnimation}
      >
        {ctaText}
      </button>
    </div>
  );
};