import { useNavigate } from "react-router-dom";
import { WaterServiceCard } from "../../components/cards/card";
import "../../styles/styles.css";
import { Archive, BanknoteArrowUp } from "lucide-react";

function Tesoreria_Cards() {
  const navigate = useNavigate();

  const handleEgresos = () => navigate("/egresos");
  const handleCorte = () => navigate("/tesoreria");

  const cards = [
    {
      title: "Gestión de Egresos",
      description:
        "Administra, registra y consulta los egresos generados dentro del módulo de tesorería.",
      icon: BanknoteArrowUp,
      ctaText: "Registrar Egreso",
      gradientColors: ["#ff9800", "#f57c00"] as [string, string],
      waterDropColor: "rgba(255, 152, 0, 0.6)",
      onClick: handleEgresos,
    },
    {
      title: "Corte de Caja",
      description:
        "Consulta, genera y da seguimiento a los cortes de caja del sistema.",
      icon: Archive,
      ctaText: "Gestionar Corte de Caja",
      gradientColors: ["#4caf50", "#388e3c"] as [string, string],
      waterDropColor: "rgba(76, 175, 80, 0.6)",
      onClick: handleCorte,
    },
  ];

  return (
    <div className="admin-page-container">
      <div className="admin-header">
        <h1 className="admin-title">Módulo de Tesorería</h1>
        <p className="admin-subtitle">
          Administra de forma eficiente los movimientos y procesos clave del
          área de tesorería.
        </p>
      </div>

      <div className="cards-grid two-cards-grid">
        {cards.map((card, index) => (
          <WaterServiceCard
            key={index}
            title={card.title}
            description={card.description}
            icon={card.icon}
            ctaText={card.ctaText}
            gradientColors={card.gradientColors}
            waterDropColor={card.waterDropColor}
            onClick={card.onClick}
            index={index}
          />
        ))}
      </div>
    </div>
  );
}

export default Tesoreria_Cards;
