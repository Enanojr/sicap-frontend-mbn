import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Botones } from "../../components/botones/Botones";
import "../../styles/styles.css";
import Logo from "../../assets/Logo.png";
import Usuario from "../../assets/usuario.png";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import Swal from "sweetalert2";
import { useAuth } from "../../services/authcontext"; // Importar useAuth

const LoginPage = () => {
  const [usuario, setUsuario] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  
  useEffect(() => {
    localStorage.removeItem('access');
    localStorage.removeItem('usuario');
  }, []);

  const navigate = useNavigate();
  const { login } = useAuth(); // Obtener login del contexto

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!usuario.trim() || !password.trim()) {
      Swal.fire({
        icon: "warning",
        title: "Error",
        text: "Por favor, ingresa ambos campos",
      });
      return;
    }

    setLoading(true);

    try {
      // Usar login del contexto
      await login(usuario, password);

      // Mostrar mensaje de bienvenida
      Swal.fire({
        icon: "success",
        title: "Bienvenido",
        text: "Has iniciado sesión correctamente",
        timer: 2000,
        showConfirmButton: false,
      });

      // Redirigir después del login exitoso
      navigate("/Main_card");
      
    } catch (error: any) {
      console.error("Error en login:", error);
      
      Swal.fire({
        icon: "error",
        title: "Oops...",
        text: error.response?.data?.message || 
              error.response?.data?.detail || 
              "Por favor verifique sus credenciales",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="loginPageContainer">
      {/* PANEL IZQUIERDO */}
      <div className="leftPanel">
        <div className="infoCard">
          <h1 className="title">COMISIÓN DEL AGUA POTABLE</h1>
          <div className="logoWrapper">
            <img src={Logo} alt="Logo de Agua" className="waterLogo" />
          </div>
          <p className="welcomeText">¡Bienvenido!</p>
        </div>
      </div>

      {/* PANEL DERECHO */}
      <div className="rightPanel">
        <div className="infoCard">
          <div className="Cabeza_Login">
            <img src={Logo} alt="Logo" className="Estilo_Logo" />
            <div className="Titulo_Login">Iniciar Sesión</div>
            <div className="Linea_Divisora_Login"></div>
          </div>
          <form onSubmit={handleSubmit}>
            <div className="Contenedor_Inputs">
              <div className="Input">
                <input
                  type="text"
                  placeholder="Usuario"
                  value={usuario}
                  onChange={(e) => setUsuario(e.target.value)}
                  disabled={loading}
                  autoComplete="username"
                />
              </div>
              <div className="Input passwordWrapper">
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Contraseña"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                  autoComplete="current-password"
                />
                <span
                  className="passwordIcon"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <FaEyeSlash /> : <FaEye />}
                </span>
              </div>
            </div>
            <Botones disabled={loading}>
              {loading ? "Iniciando..." : "Iniciar"}
            </Botones>
          </form>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;