import React, { useState, useEffect, useRef } from "react";
import { FaUserCircle } from "react-icons/fa";
import Logo from "../../assets/Logo.png";
import { useTheme } from "../botones/ThemeContext";
import { useAuth } from "../../services/authcontext";
import "../../styles/styles.css";
import Swal from "sweetalert2";
import { Link } from "react-router-dom"; // <-- 1. IMPORTADO Link

// Define tus roles
const ROLES = {
  ADMIN: "admin",
  SUPERVISOR: "supervisor",
  COBRADOR: "cobrador",
};

const Navbar: React.FC = () => {
  const { theme } = useTheme();
  const { usuario, logout } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState<boolean>(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [isScrolled, setIsScrolled] = useState(false);

  const canViewAdminPanel =
    usuario?.role === ROLES.ADMIN || usuario?.role === ROLES.SUPERVISOR;

  // <-- 3. LÓGICA DE "INICIO" DINÁMICO -->
  const getHomeLink = () => {
    switch (usuario?.role) {
      case ROLES.ADMIN:
      case ROLES.SUPERVISOR:
        return "/Main_card";
      case ROLES.COBRADOR:
        // Asegúrate de que esta sea la ruta correcta para cobradores
        return "/Rutas_Cobrador";
      default:
        // Un 'fallback' seguro si el rol no existe o no ha cargado
        return "/";
    }
  };
  const homeLink = getHomeLink();
  // <-- FIN DE LÓGICA DINÁMICA -->

  // Efecto para cerrar el menú (sin cambios)
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [dropdownRef]);

  // Efecto para el scroll (sin cambios)
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener("scroll", handleScroll);
    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  // Lógica de Logout (sin cambios)
  const handleLogout = () => {
    Swal.fire({
      title: "¿Cerrar sesión?",
      text: "¿Estás seguro de que quieres salir?",
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: "#58b2ee",
      cancelButtonColor: "#d33",
      confirmButtonText: "Sí, cerrar sesión",
      cancelButtonText: "Cancelar",
    }).then((result) => {
      if (result.isConfirmed) {
        logout();
        setDropdownOpen(false);

        Swal.fire({
          icon: "success",
          title: "Sesión cerrada",
          text: "Has cerrado sesión correctamente",
          timer: 1500,
          showConfirmButton: false,
        });
      }
    });
  };

  return (
    <header
      className={`navbar-container ${theme} ${isScrolled ? "scrolled" : ""}`}
    >
      <div className="navbar-section">
        {/* <-- 1. CAMBIADO <a> por <Link> y href por to --> */}
        {/* <-- 3. Usa el enlace dinámico --> */}
        <Link to={homeLink} className="nav-link">
          Inicio
        </Link>
      </div>

      <div className="navbar-logo">
        <img src={Logo} alt="Logo de la empresa" />
      </div>

      <div className="navbar-section profile-section" ref={dropdownRef}>
        {/* <-- 2. MEJORA DE ACCESIBILIDAD --> */}
        {/* Se cambió el ícono por un <button> para accesibilidad */}
        <button
          className="profile-button" // <-- Necesitarás añadir esta clase a tu CSS
          onClick={() => setDropdownOpen(!dropdownOpen)}
          aria-label="Abrir menú de usuario"
          aria-haspopup="true"
          aria-expanded={dropdownOpen}
        >
          <FaUserCircle className="profile-icon" />
        </button>
        {/* <-- FIN DE MEJORA --> */}

        {/* Dropdown Menu */}
        {dropdownOpen && (
          // Se añadió 'role="menu"' por accesibilidad
          <div className="dropdown-menu" role="menu">
            {/* Información del usuario (sin cambios) */}
            <div
              className="dropdown-item"
              style={{
                borderBottom: "1px solid #ddd",
                fontWeight: "bold",
                pointerEvents: "none",
                paddingBottom: "8px",
                marginBottom: "8px",
              }}
            >
              <div style={{ fontSize: "14px", color: "#333" }}>
                {usuario?.nombre} {usuario?.apellidos}
              </div>
              <div
                style={{
                  fontSize: "11px",
                  color: "#888",
                  fontFamily: "Arial",
                  fontWeight: "normal",
                  textTransform: "uppercase",
                  marginTop: "4px",
                }}
              >
                {usuario?.role}
              </div>
            </div>

            {/* <-- 1. CAMBIADO <a> por <Link> y href por to --> */}
            {canViewAdminPanel && (
              <Link
                to="/Admin_Cards"
                className="dropdown-item"
                onClick={() => setDropdownOpen(false)}
                role="menuitem" // <-- Accesibilidad
              >
                Panel de Administración
              </Link>
            )}

            {/* Opción de Cerrar Sesión (sin cambios, <a> está bien aquí) */}
            <a
              href="#"
              className="dropdown-item"
              onClick={(e) => {
                e.preventDefault();
                handleLogout();
              }}
              style={{ color: "#ff4444" }}
              role="menuitem" // <-- Accesibilidad
            >
              Cerrar sesión
            </a>
          </div>
        )}
      </div>
    </header>
  );
};

export default Navbar;
