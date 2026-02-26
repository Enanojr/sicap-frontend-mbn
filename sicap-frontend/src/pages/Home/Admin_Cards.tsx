import { useNavigate } from "react-router-dom";
import { WaterServiceCard } from "../../components/cards/card";
import "../../styles/styles.css";
import {
  UserCog,
  UserSquare,
  MapPin,
  Home,
  Clipboard,
  Percent,
  Wrench,
  Settings,
  //TrendingUp,
  //Users,
} from "lucide-react";

// Componente para las tarjetas de estadísticas
{
  /*const StatCard = ({ 
  icon: Icon, 
  value, 
  label, 
  color 
}: { 
  icon: React.ComponentType<{ size?: number }>, 
  value: string, 
  label: string, 
  color: string 
}) => (
  <div className="stat-card">
    <div className="stat-icon" style={{ backgroundColor: `${color}20`, color: color }}>
      <Icon size={24} />
    </div>
    <div className="stat-content">
      <div className="stat-value">{value}</div>
      <div className="stat-label">{label}</div>
    </div>
  </div>
);*/
}

function Admin_Cards() {
  const navigate = useNavigate();

  const handleAdmin = () => navigate("/Radmin");
  const handleCobradores = () => navigate("/Rcobradores");
  const handleColonias = () => navigate("/Rcolonia");
  const handleSector = () => navigate("/Rsector");
  const handleAsignacion = () => navigate("/Rasignacion");
  const handleDescuento = () => navigate("/Descuento");
  const handleServicios = () => navigate("/Servicios");
  const handleCierreAnual = () => navigate("/cierreanual");
  const handleCargos = () => navigate("/tcargos");

  // Array de configuración de cards
  const cards = [
    {
      title: "Registro de Administradores",
      description: "Registra nuevos administradores para gestionar el sistema.",
      icon: UserCog,
      ctaText: "Registrar Admin",
      gradientColors: ["#2196f3", "#1976d2"] as [string, string],
      waterDropColor: "rgba(33, 150, 243, 0.6)",
      onClick: handleAdmin,
    },
    {
      title: "Registro de Cobradores",
      description: "Registra nuevos cobradores.",
      icon: UserSquare,
      ctaText: "Registrar Cobrador",
      gradientColors: ["#4caf50", "#388e3c"] as [string, string],
      waterDropColor: "rgba(76, 175, 80, 0.6)",
      onClick: handleCobradores,
    },
    {
      title: "Registro de Sectores",
      description: "Registra nuevos sectores en el sistema.",
      icon: MapPin,
      ctaText: "Registrar Sector",
      gradientColors: ["#ff9800", "#f57c00"] as [string, string],
      waterDropColor: "rgba(255, 152, 0, 0.6)",
      onClick: handleSector,
    },
    {
      title: "Registro de Colonias",
      description: "Registra nuevas colonias en el sistema.",
      icon: Home,
      ctaText: "Registrar Colonia",
      gradientColors: ["#009688", "#00796b"] as [string, string],
      waterDropColor: "rgba(0, 150, 136, 0.6)",
      onClick: handleColonias,
    },
    {
      title: "Asignaciones a cobradores",
      description: "Asigna las calles que van a visitar los cobradores.",
      icon: Clipboard,
      ctaText: "Asignar Cobrador",
      gradientColors: ["#f44336", "#d32f2f"] as [string, string],
      waterDropColor: "rgba(244, 67, 54, 0.6)",
      onClick: handleAsignacion,
    },
    {
      title: "Registro de Descuentos",
      description: "Registra nuevos descuentos para los cuentahabientes.",
      icon: Percent,
      ctaText: "Registrar Descuento",
      gradientColors: ["#3f51b5", "#303f9f"] as [string, string],
      waterDropColor: "rgba(63, 81, 181, 0.6)",
      onClick: handleDescuento,
    },
    {
      title: "Registro de Servicios",
      description: "Registra nuevos tipos de servicio en el sistema.",
      icon: Wrench,
      ctaText: "Registrar Servicio",
      gradientColors: ["#795548", "#5d4037"] as [string, string],
      waterDropColor: "rgba(121, 85, 72, 0.6)",
      onClick: handleServicios,
    },
    {
      title: "Registro de cargos",
      description: "Registra nuevos cargos en el sistema.",
      icon: Clipboard,
      ctaText: "Registrar Cargo",
      gradientColors: ["#51bbbb", "#51bbbb"] as [string, string],
      waterDropColor: "rgba(129, 118, 56, 0.6)",
      onClick: handleCargos,
    },
    {
      title: "Cierre anual",
      description: "Seccion de cierre de cuentas anual.",
      icon: Wrench,
      ctaText: "Cerrar Cuenta",
      gradientColors: ["#a7a546", "#979639"] as [string, string],
      waterDropColor: "rgba(129, 118, 56, 0.6)",
      onClick: handleCierreAnual,
    },
  ];

  return (
    <div className="admin-page-container">
      {/* Header Section */}
      <div className="admin-header">
        <div className="breadcrumb">
          <Settings size={16} />
          <span>Panel de Administración</span>
        </div>
        <h1 className="admin-title">Gestión del Sistema</h1>
        <p className="admin-subtitle">
          Administra todos los aspectos del sistema desde un solo lugar
        </p>
      </div>

      {/* Stats Section 
      <div className="stats-grid">
        <StatCard 
          icon={Users} 
          value="47" 
          label="Cobradores Activos" 
          color="#4caf50" 
        />
        <StatCard 
          icon={TrendingUp} 
          value="89%" 
          label="Eficiencia" 
          color="#2196f3" 
        />
        <StatCard 
          icon={MapPin} 
          value="12" 
          label="Sectores" 
          color="#ff9800" 
        />
      </div>*/}

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

export default Admin_Cards;
