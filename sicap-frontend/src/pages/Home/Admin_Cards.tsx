import { useNavigate } from "react-router-dom";
import { WaterServiceCard } from "../../components/cards/card";
import "../../styles/styles.css";
import {
  UserCog,
  UserSquare,
  MapPin,
  Home,
  Banknote,
  Clipboard,
  Drill,
  Stamp,
  Percent,
  Wrench,
  Settings,
  //TrendingUp,
  //Users,
  UsersRound,
  Milestone,
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
  //const handleColonias = () => navigate("/Rcolonia");
  //const handleSector = () => navigate("/Rsector");
  //const handleAsignacion = () => navigate("/Rasignacion");
  const handleDescuento = () => navigate("/Descuento");
  const handleServicios = () => navigate("/Servicios");
  const handleCierreAnual = () => navigate("/cierreanual");
  const handleCargos = () => navigate("/tcargos");
  //const handleGrupos = () => navigate("/grupos");
  //const handleCalles = () => navigate("/calles");

  // Array de configuración de cards
  const cards = [
    {
      title: "Registro de Administradores",
      description: "Registra nuevos administradores para gestionar el sistema.",
      icon: UserCog,
      ctaText: "Registrar Admin",
      gradientColors: ["#4361ee", "#3a0ca3"] as [string, string],
      waterDropColor: "rgba(67, 97, 238, 0.35)",
      onClick: handleAdmin,
    },
    {
      title: "Registro de Cobradores",
      description: "Registra nuevos cobradores.",
      icon: UserSquare,
      ctaText: "Registrar Cobrador",
      gradientColors: ["#2a9d8f", "#1d7874"] as [string, string],
      waterDropColor: "rgba(42, 157, 143, 0.35)",
      onClick: handleCobradores,
    },
    /* {
      title: "Registro de Sectores",
      description: "Registra nuevos sectores en el sistema.",
      icon: MapPin,
      ctaText: "Registrar Sector",
      gradientColors: ["#f77f00", "#d62828"] as [string, string],
      waterDropColor: "rgba(247, 127, 0, 0.35)",
      onClick: handleSector,
    }, 
    /*{
      title: "Registro de Colonias",
      description: "Registra nuevas colonias en el sistema.",
      icon: Home,
      ctaText: "Registrar Colonia",
      gradientColors: ["#4cc9f0", "#4895ef"] as [string, string],
      waterDropColor: "rgba(76, 201, 240, 0.35)",
      onClick: handleColonias,
    },
    {
      title: "Asignaciones a cobradores",
      description: "Asigna las calles que van a visitar los cobradores.",
      icon: Clipboard,
      ctaText: "Asignar Cobrador",
      gradientColors: ["#ef476f", "#d62839"] as [string, string],
      waterDropColor: "rgba(239, 71, 111, 0.35)",
      onClick: handleAsignacion,
    },*/
    {
      title: "Registro de Descuentos",
      description: "Registra nuevos descuentos para los cuentahabientes.",
      icon: Percent,
      ctaText: "Registrar Descuento",
      gradientColors: ["#8338ec", "#5a189a"] as [string, string],
      waterDropColor: "rgba(131, 56, 236, 0.35)",
      onClick: handleDescuento,
    },
    {
      title: "Registro de Servicios",
      description: "Registra nuevos tipos de servicio en el sistema.",
      icon: Drill,
      ctaText: "Registrar Servicio",
      gradientColors: ["#c77d00", "#a05a00"] as [string, string],
      waterDropColor: "rgba(199, 125, 0, 0.35)",
      onClick: handleServicios,
    },
    {
      title: "Registro de cargos",
      description: "Registra nuevos cargos en el sistema.",
      icon: Banknote,
      ctaText: "Registrar Cargo",
      gradientColors: ["#00b4d8", "#0077b6"] as [string, string],
      waterDropColor: "rgba(0, 180, 216, 0.35)",
      onClick: handleCargos,
    },
    {
      title: "Cierre anual",
      description: "Sección de cierre de cuentas anual.",
      icon: Stamp,
      ctaText: "Cerrar Cuenta",
      gradientColors: ["#8d99ae", "#2b2d42"] as [string, string],
      waterDropColor: "rgba(141, 153, 174, 0.35)",
      onClick: handleCierreAnual,
    },
    /*{
      title: "Gestión de Grupos",
      description: "Administra y organiza los grupos del sistema.",
      icon: UsersRound,
      ctaText: "Administrar Grupos",
      gradientColors: ["#7209b7", "#560bad"] as [string, string],
      waterDropColor: "rgba(114, 9, 183, 0.35)",
      onClick: handleGrupos,
    },
    {
      title: "Gestión de Calles",
      description: "Administra y organiza las calles del sistema.",
      icon: Milestone,
      ctaText: "Administrar Calles",
      gradientColors: ["#f72585", "#b5179e"] as [string, string],
      waterDropColor: "rgba(247, 37, 133, 0.35)",
      onClick: handleCalles,
    },*/
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
