import { useNavigate } from "react-router-dom";
import { WaterServiceCard } from "../../components/cards/card";
//import { DashboardStats } from "../../components/dashboard/DashboardStats";
import "../../styles/styles.css";
import {
  Users,
  Search,
  Newspaper,
  FileChartColumn,
  Archive,
  Banknote,
} from "lucide-react";

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
  const handleReportes = () => navigate("/reportes");

  const cards = [
    {
      title: "Consulta de Pagos Realizados",
      description: "Consulta los pagos que ha realizado el cuentahabiente.",
      icon: Search,
      ctaText: "Consultar",
      gradientColors: ["#06b6d4", "#2563eb"] as [string, string],
      waterDropColor: "rgba(6, 182, 212, 0.30)",
      onClick: handleConsult,
    },
    {
      title: "Pagos",
      description: "Realiza el cobro de agua de los cuentahabientes.",
      icon: Banknote,
      ctaText: "Pagar",
      gradientColors: ["#ef4444", "#b91c1c"] as [string, string],
      waterDropColor: "rgba(239, 68, 68, 0.30)",
      onClick: handlePayment,
    },
    {
      title: "Registra o Consulta Cuentahabientes",
      description:
        "Registra nuevos cuentahabientes o consulta los ya existentes",
      icon: Users,
      ctaText: "Registrar",
      gradientColors: ["#a855f7", "#6d28d9"] as [string, string],
      waterDropColor: "rgba(168, 85, 247, 0.30)",
      onClick: handleCuentahabientes,
    },
    {
      title: "Estado de Cuenta",
      description: "Crea o consulta el estado de cuenta de los cuentahabiente",
      icon: Newspaper,
      ctaText: "Crear",
      gradientColors: ["#6366f1", "#3730a3"] as [string, string],
      waterDropColor: "rgba(99, 102, 241, 0.30)",
      onClick: handleEstadoCuenta,
    },
    {
      title: "Cargos a Cuentahabientes",
      description: "Crea o consulta los cargos de los cuentahabientes",
      icon: Banknote,
      ctaText: "Pagar",
      gradientColors: ["#f59e0b", "#d97706"] as [string, string],
      waterDropColor: "rgba(245, 158, 11, 0.30)",
      onClick: handleCargos,
    },
    {
      title: "Corte de Caja",
      description: "Genera el corte de caja para un rango de fechas específico",
      icon: Archive,
      ctaText: "Generar",
      gradientColors: ["#10b981", "#047857"] as [string, string],
      waterDropColor: "rgba(16, 185, 129, 0.30)",
      onClick: handleCorteCaja,
    },
    {
      title: "Reportes",
      description: "Genera reportes sobre la información de tú plataforma",
      icon: FileChartColumn,
      ctaText: "Generar",
      gradientColors: ["#0f766e", "#134e4a"] as [string, string],
      waterDropColor: "rgba(15, 118, 110, 0.30)",
      onClick: handleReportes,
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

      {/* Dashboard Stats */}
      {/* <DashboardStats /> */}
    </div>
  );
}

export default Main_Card;
