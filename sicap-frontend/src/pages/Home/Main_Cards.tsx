import { useNavigate } from 'react-router-dom';
import {WaterServiceCard} from '../../components/cards/card'
import '../../styles/styles.css';

// Iconos
const SearchIcon = ({ className }: { className: string }) => (
  <svg className={className} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <circle cx="11" cy="11" r="8" />
    <path d="m21 21-4.35-4.35" />
  </svg>
);

const PaymentIcon = ({ className }: { className: string }) => (
  <svg className={className} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <rect x="2" y="5" width="20" height="14" rx="2" />
    <line x1="2" y1="10" x2="22" y2="10" />
  </svg>
);

const ReportIcon = ({ className }: { className: string }) => (
  <svg className={className} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <polyline points="14 2 14 8 20 8" />
    <line x1="16" y1="13" x2="8" y2="13" />
    <line x1="16" y1="17" x2="8" y2="17" />
    <polyline points="10 9 9 9 8 9" />
  </svg>
);

function Main_Card() {

  const navigate = useNavigate();
  const handlePayment = () => {
    console.log('Navegando a pagos...');
    
  };

  const handleConsult = () => {
    console.log('Navegando a consultas...');
    navigate('/Tabla')
   
  };

  const handleReports = () => {
    console.log('Navegando a informes...');
    
  };

  return (
    <div className="waterCardsContainer">
      <div className="waterCardsWrapper">

        {/* Card de Consultas */}
        <WaterServiceCard
          title="Consultas"
          description="Consulta tu consumo, saldo y detalles de tu cuenta."
          icon={SearchIcon}
          ctaText="Consultar"
          gradientColors={['#4ecdc4', '#2c9fb9']}
          waterDropColor="rgba(78, 205, 196, 0.6)"
          onClick={handleConsult}
        />

        {/* Card de Pagos */}
        <WaterServiceCard
          title="Pagos"
          description="Realiza el pago de tu recibo de agua de forma rápida y segura."
          icon={PaymentIcon}
          ctaText="Pagar Ahora"
          gradientColors={['#ff6b6b', '#d63031']}
          waterDropColor="rgba(255, 107, 107, 0.6)"
          onClick={handlePayment}
        />

        {/* Card de Informes */}
        <WaterServiceCard
          title="Informes"
          description="Descarga tus recibos, reportes de consumo e historial."
          icon={ReportIcon}
          ctaText="Ver Informes"
          gradientColors={['#a29bfe', '#6c5ce7']}
          waterDropColor="rgba(162, 155, 254, 0.6)"
          onClick={handleReports}
        />
      </div>
    </div>
  );
}

export default Main_Card;