import React, { useState, useEffect, useRef } from "react";
import { FaUserCircle } from "react-icons/fa";
import Logo from "../../assets/Logo.png";
import { useTheme } from "../botones/ThemeContext";
import { useAuth } from "../../services/authcontext";
import "../../styles/styles.css";
import Swal from "sweetalert2";
import { Link } from "react-router-dom";

const Navbar: React.FC = () => {
  const { theme } = useTheme();
  const { usuario, logout } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState<boolean>(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [isScrolled, setIsScrolled] = useState(false);

  // Normaliza el rol para comparaciones
  const userRole = usuario?.role?.toLowerCase().trim();

  const canViewAdminPanel =
    userRole === "admin" || userRole === "supervisor";

  // Efecto para cerrar el menú
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

  // Efecto para el scroll
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener("scroll", handleScroll);
    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  // Lógica de Logout
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
        <Link to="/Main_card" className="nav-link">
          Inicio
        </Link>
      </div>

      <div className="navbar-logo">
        <img src={Logo} alt="Logo de la empresa" />
      </div>

      <div className="navbar-section profile-section" ref={dropdownRef}>
        <button
          className="profile-button"
          onClick={() => setDropdownOpen(!dropdownOpen)}
          aria-label="Abrir menú de usuario"
          aria-haspopup="true"
          aria-expanded={dropdownOpen}
        >
          <FaUserCircle className="profile-icon" />
        </button>

        {dropdownOpen && (
          <div className="dropdown-menu" role="menu">
            {/* Información del usuario */}
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

            {/* Panel de Administración */}
            {canViewAdminPanel && (
              <Link
                to="/Admin_Cards"
                className="dropdown-item"
                onClick={() => setDropdownOpen(false)}
                role="menuitem"
              >
                Panel de Administración
              </Link>
            )}

            {/* Cerrar Sesión */}
            <a
              href="#"
              className="dropdown-item"
              onClick={(e) => {
                e.preventDefault();
                handleLogout();
              }}
              style={{ color: "#ff4444" }}
              role="menuitem"
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
