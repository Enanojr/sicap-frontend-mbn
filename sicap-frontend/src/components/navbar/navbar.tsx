import React, { useState, useEffect, useRef } from 'react';
import { FaUserCircle } from 'react-icons/fa';
import Logo from '../../assets/Logo.png';
import { useTheme } from '../botones/ThemeContext';
import { useAuth } from '../../services/authcontext';
import '../../styles/styles.css';
import Swal from 'sweetalert2';

// <-- 1. Define tus roles para evitar errores de tipeo -->
const ROLES = {
  ADMIN: 'admin',
  SUPERVISOR: 'supervisor',
  COBRADOR: 'cobrador'
};

const Navbar: React.FC = () => {
  const { theme } = useTheme();
  const { usuario, logout } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState<boolean>(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [isScrolled, setIsScrolled] = useState(false);

  // <-- 2. Crea una variable para la lógica de permisos -->
  // Esto hace que el JSX sea mucho más limpio
  const canViewAdminPanel = usuario?.role === ROLES.ADMIN || usuario?.role === ROLES.SUPERVISOR;

  // Efecto para cerrar el menú (sin cambios)
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
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
    window.addEventListener('scroll', handleScroll);
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  // Lógica de Logout (sin cambios)
  const handleLogout = () => {
    Swal.fire({
      title: '¿Cerrar sesión?',
      text: "¿Estás seguro de que quieres salir?",
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#58b2ee',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Sí, cerrar sesión',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        logout();
        setDropdownOpen(false);
        
        Swal.fire({
          icon: 'success',
          title: 'Sesión cerrada',
          text: 'Has cerrado sesión correctamente',
          timer: 1500,
          showConfirmButton: false
        });
      }
    });
  };

  return (
    <header className={`navbar-container ${theme} ${isScrolled ? 'scrolled' : ''}`}>
      <div className="navbar-section">
        {/* <-- 3. Puedes usar la misma lógica aquí si 'Inicio' también es condicional --> */}
        {/* Por ahora, asumimos que todos ven "Inicio" */}
        <a href="/Main_card" className="nav-link">Inicio</a>
      </div>

      <div className="navbar-logo">
        <img src={Logo} alt="Logo de la empresa" />
      </div>
      
      <div className="navbar-section profile-section" ref={dropdownRef}>
        <FaUserCircle
          className="profile-icon"
          onClick={() => setDropdownOpen(!dropdownOpen)}
        />

        {/* Dropdown Menu */}
        {dropdownOpen && (
          <div className="dropdown-menu">
            {/* Información del usuario (sin cambios) */}
            <div className="dropdown-item" style={{ 
              borderBottom: '1px solid #ddd', 
              fontWeight: 'bold',
              pointerEvents: 'none',
              paddingBottom: '8px',
              marginBottom: '8px'
            }}>
              <div style={{ fontSize: '14px', color: '#333' }}>
                {usuario?.nombre} {usuario?.apellidos}
              </div>
              <div style={{ 
                fontSize: '11px', 
                color: '#888',
                fontFamily: 'Arial', 
                fontWeight: 'normal',
                textTransform: 'uppercase',
                marginTop: '4px'
              }}>
                {usuario?.role}
              </div>
            </div>

            {/* <-- 4. RENDERIZADO CONDICIONAL --> */}
            {/* El enlace solo se mostrará si 'canViewAdminPanel' es true */}
            {canViewAdminPanel && (
              <a 
                href="/Admin_Cards" 
                className="dropdown-item"
                onClick={() => setDropdownOpen(false)}
              >
                Panel de Administración
              </a>
            )}
            
            {/* Opción de Cerrar Sesión (sin cambios) */}
            <a 
              href="#" 
              className="dropdown-item"
              onClick={(e) => {
                e.preventDefault();
                handleLogout();
              }}
              style={{ color: '#ff4444' }} 
            >
              Cerrar sesión
            </a>
          </div>
        )}
      </div>
    </header>
  );
}

export default Navbar;