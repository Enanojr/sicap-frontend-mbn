import { useNavigate } from "react-router-dom";
import { WaterServiceCard } from "../../components/cards/card";
import { DashboardStats } from "../../components/dashboard/DashboardStats";
import "../../styles/styles.css";
import { Users, Search, CreditCard, Newspaper } from "lucide-react";

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

  const handleEstadoCuenta = () => navigate("/estadocuenta");
  const handleCargos = () => navigate("/cargos");
  const handleCorteCaja = () => navigate("/corte-caja");

  const cards = [
    {
      title: "Consulta de Pagos Realizados",
      description: "Consulta los pagos que ha realizado el cuentahabiente.",
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
      ctaText: "Pagar",
      gradientColors: ["#ff6b6b", "#d63031"] as [string, string],
      waterDropColor: "rgba(255, 107, 107, 0.6)",
      onClick: handlePayment,
    },
    {
      title: "Registra o Consulta Cuentahabientes",
      description:
        "Registra nuevos cuentahabientes o consulta los ya existentes",
      icon: Users,
      ctaText: "Registrar",
      gradientColors: ["#9c27b0", "#7b1fa2"] as [string, string],
      waterDropColor: "rgba(156, 39, 176, 0.6)",
      onClick: handleCuentahabientes,
    },
    {
      title: "Estado de Cuenta",
      description: "Crea o consulta el estado de cuenta de los cuentahabiente",
      icon: Newspaper,
      ctaText: "Crear",
      gradientColors: ["#5e35b1", "#4527a0"] as [string, string],
      waterDropColor: "rgba(94, 53, 177, 0.6)",
      onClick: handleEstadoCuenta,
    },
    {
      title: "Cargos a Cuentahabientes",
      description: "Crea o consulta los cargos de los cuentahabientes",
      icon: CreditCard,
      ctaText: "Pagar",
      gradientColors: ["#f1a707", "#f1a707"] as [string, string],
      waterDropColor: "rgba(241, 167, 7, 0.6)",
      onClick: handleCargos,
    },
    {
      title: "Corte de Caja",
      description: "Genera el corte de caja para un rango de fechas específico",
      icon: CreditCard,
      ctaText: "Generar",
      gradientColors: ["#00c853", "#009624"] as [string, string],
      waterDropColor: "rgba(0, 200, 83, 0.6)",
      onClick: handleCorteCaja,
    }
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

      <DashboardStats />
    </div>
  );
}

export default Main_Card;
