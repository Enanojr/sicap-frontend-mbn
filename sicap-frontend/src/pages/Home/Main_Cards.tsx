import { useNavigate } from "react-router-dom";
import { WaterServiceCard } from "../../components/cards/card";
import "../../styles/styles.css";
import { Users, Search, CreditCard } from "lucide-react";

// Componente para el header de la página principal
const MainHeader = () => (
  <div className="admin-header">
    <h1 className="admin-title">Panel Principal</h1>
    <p className="admin-subtitle">
      Accede rápidamente a las funciones principales del sistema
    </p>
  </div>
);

function Main_Card() {
  const navigate = useNavigate();

  const handlePayment = () => {
    navigate("/Pago");
  };

  const handleConsult = () => {
    navigate("/Tabla");
  };

  const handleCuentahabientes = () => navigate("/Rcuentahabiente");

  // Array de configuración de cards
  const cards = [
    {
      title: "Consultas",
      description: "Consulta tu consumo, saldo y detalles de tu cuenta.",
      icon: Search,
      ctaText: "Consultar",
      gradientColors: ["#4ecdc4", "#2c9fb9"] as [string, string],
      waterDropColor: "rgba(78, 205, 196, 0.6)",
      onClick: handleConsult,
    },
    {
      title: "Pagos",
      description: "Realiza el cobro de agua de los cuentahabientes.",
      icon: CreditCard,
      ctaText: "Pagar Ahora",
      gradientColors: ["#ff6b6b", "#d63031"] as [string, string],
      waterDropColor: "rgba(255, 107, 107, 0.6)",
      onClick: handlePayment,
    },
    {
      title: "Registro de Cuentahabientes",
      description: "Registra nuevos cuentahabientes",
      icon: Users,
      ctaText: "Registrar Cuentahabiente",
      gradientColors: ["#9c27b0", "#7b1fa2"] as [string, string],
      waterDropColor: "rgba(156, 39, 176, 0.6)",
      onClick: handleCuentahabientes,
    },
  ];

  return (
    <div className="admin-page-container">
      {/* Header Section */}
      <MainHeader />

      {/* Cards Grid */}
      <div className="cards-grid">
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

export default Main_Card;