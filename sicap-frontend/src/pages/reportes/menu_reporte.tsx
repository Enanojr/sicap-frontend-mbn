import { useNavigate } from "react-router-dom";
import { WaterServiceCard } from "../../components/cards/card";
import "../../styles/styles.css";
import { HandCoins, Milestone } from "lucide-react";

function Menu_reporte() {
  const navigate = useNavigate();

  const handleRCobradores = () => {
    navigate("/reportes");
  };

  const handleRCalles = () => {
    navigate("/reporteCalle");
  };

  const cards = [
    {
      title: "Reportes por Cobrador",
      description:
        "Genera reportes de la información de la plataforma, clasificados por cobrador",
      icon: HandCoins,
      ctaText: "Generar",
      gradientColors: ["#64748b", "#1e293b"] as [string, string],
      waterDropColor: "rgba(100, 116, 139, 0.30)",
      onClick: handleRCobradores,
    },
    {
      title: "Reportes por Calle",
      description:
        "Genera reportes de la información de la plataforma, clasificados por calle",
      icon: Milestone,
      ctaText: "Generar",
      gradientColors: ["#84cc16", "#365314"] as [string, string],
      waterDropColor: "rgba(132, 204, 22, 0.30)",
      onClick: handleRCalles,
    },
  ];

  return (
    <div className="admin-page-container">
      <div className="admin-header">
        <h1 className="admin-title">Reportería</h1>
        <p className="admin-subtitle">
          Genera reportes a partir de la información registrada en la
          plataforma.
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

export default Menu_reporte;
