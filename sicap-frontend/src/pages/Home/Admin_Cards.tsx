import { useNavigate } from "react-router-dom";
import { WaterServiceCard } from "../../components/cards/card";
import "../../styles/styles.css";
import {
  UserCog,
  UserSquare,
  Users,
  MapPin,
  Home,
  Clipboard,
  Percent,
  Wrench,
} from "lucide-react";


const ROLES = {
  ADMIN: 'admin',
  SUPERVISOR: 'supervisor',
  COBRADOR: 'cobrador'
};

function Admin_Cards() {
  const navigate = useNavigate();

  const userString = localStorage.getItem('usuario'); 
  
  let role = null;
  
  if (userString) {
    const user = JSON.parse(userString); 
    role = user?.role; 
  }
  
  const canViewAll = role === ROLES.ADMIN || role === ROLES.SUPERVISOR;

  const handleAdmin = () => navigate("/Radmin");
  const handleCobradores = () => navigate("/Rcobradores");
  const handleColonias = () => navigate("/Rcolonia");
  const handleCuentahabientes = () => navigate("/Rcuentahabiente");
  const handleSector = () => navigate("/Rsector");
  const handleAsignacion = () => navigate("/Rasignacion");
  const handleDescuento = () => navigate("/Descuento");
  const handleServicios = () => navigate("/Servicios");

  if (!role) {
    console.error("No se encontró un rol de usuario en localStorage.");
    return null; 
  }

  return (
    <div className="waterCardsContainer">
      <div className="waterCardsWrapper">

        {/* --- TARJETAS SÓLO PARA ADMIN/SUPERVISOR --- */}
        {canViewAll && (
          <>
            {/* Card de Admin */}
            <WaterServiceCard
              title="Registro de Administradores"
              description="Registra nuevos administradores para gestionar el sistema."
              icon={UserCog}
              ctaText="Registrar Admin"
              gradientColors={["#2196f3", "#1976d2"]}
              waterDropColor="rgba(33, 150, 243, 0.6)"
              onClick={handleAdmin}
            />

            {/* Card de Cobradores */}
            <WaterServiceCard
              title="Registro de Cobradores"
              description="Registra nuevos cobradores para gestionar el sistema."
              icon={UserSquare}
              ctaText="Registrar Cobrador"
              gradientColors={["#4caf50", "#388e3c"]}
              waterDropColor="rgba(76, 175, 80, 0.6)"
              onClick={handleCobradores}
            />
          </>
        )}

        {/* --- TARJETA PARA ADMIN/SUPERVISOR Y COBRADOR --- */}
        {(canViewAll || role === ROLES.COBRADOR) && (
          <WaterServiceCard
            title="Registro de Cuentahabientes"
            description="Registra nuevos cuentahabientes"
            icon={Users}
            ctaText="Registrar Cuentahabiente"
            gradientColors={["#9c27b0", "#7b1fa2"]}
            waterDropColor="rgba(156, 39, 176, 0.6)"
            onClick={handleCuentahabientes}
          />
        )}

        {/* --- RESTO DE TARJETAS SÓLO PARA ADMIN/SUPERVISOR --- */}
        {canViewAll && (
          <>
            {/* Card de Sectores */}
            <WaterServiceCard
              title="Registro de Sectores"
              description="Registra nuevos sectores para gestionar el sistema."
              icon={MapPin}
              ctaText="Registrar Sector"
              gradientColors={["#ff9800", "#f57c00"]}
              waterDropColor="rgba(255, 152, 0, 0.6)"
              onClick={handleSector}
            />

            {/* Card de Colonias */}
            <WaterServiceCard
              title="Registro de Colonias"
              description="Registra nuevas colonias para gestionar el sistema."
              icon={Home}
              ctaText="Registrar Colonia"
              gradientColors={["#009688", "#00796b"]}
              waterDropColor="rgba(0, 150, 136, 0.6)"
              onClick={handleColonias}
            />

            {/* Card de Asignaciones */}
            <WaterServiceCard
              title="Asignaciones a cobradores"
              description="Asigna las calles que van a visitar los cobradores."
              icon={Clipboard}
              ctaText="Asignar Cobrador"
              gradientColors={["#f44336", "#d32f2f"]}
              waterDropColor="rgba(244, 67, 54, 0.6)"
              onClick={handleAsignacion}
            />

            {/* Card de Descuentos */}
            <WaterServiceCard
              title="Registro de Descuentos"
              description="Registra nuevos descuentos para los cuentahabientes."
              icon={Percent}
              ctaText="Registrar Descuento"
              gradientColors={["#3f51b5", "#303f9f"]}
              waterDropColor="rgba(63, 81, 181, 0.6)"
              onClick={handleDescuento}
            />

            {/* Card de Servicios */}
            <WaterServiceCard
              title="Registro de Servicios"
              description="Registra nuevos tipos de servicio en el sistema."
              icon={Wrench}
              ctaText="Registrar Servicio"
              gradientColors={["#795548", "#5d4037"]}
              waterDropColor="rgba(121, 85, 72, 0.6)"
              onClick={handleServicios}
            />
          </>
        )}
      </div>
    </div>
  );
}

export default Admin_Cards;