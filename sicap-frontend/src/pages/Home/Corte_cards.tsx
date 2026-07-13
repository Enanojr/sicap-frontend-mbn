import { useNavigate } from "react-router-dom";
import { WaterServiceCard } from "../../components/cards/card";
import "../../styles/styles.css";
import { Archive, BanknoteArrowUp } from "lucide-react";

function Corte_Cards() {
  const navigate = useNavigate();

  const handleEgresos = () => navigate("/corte-junior");
  const handleCorte = () => navigate("/corte-senior");

  const cards = [
    {
      title: "Corte Jr",
      description:
        "Realiza los cortes de caja a los cobradores",
      icon: BanknoteArrowUp,
      ctaText: "Registrar Egreso",
      gradientColors: ["#002fffad", "#007ff5"] as [string, string],
      waterDropColor: "rgba(126, 121, 115, 0.6)",
      onClick: handleEgresos,
    },
    {
      title: "Corte Sr",
      description:
        "Realiza los cortes de caja a tus Tesoreros JR",
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
        <h1 className="admin-title">Módulo de Cortes</h1>
        <p className="admin-subtitle">
          Administra los cortes de caja de manera eficiente.
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

export default Corte_Cards;
