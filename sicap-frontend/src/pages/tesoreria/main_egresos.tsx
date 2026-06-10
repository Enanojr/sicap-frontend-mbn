import React from "react";
import FormularioEgresos from "./formulario_egresos";
import HistoricoEgresos from "./tabla_egresos";
import "../../styles/styles.css";

const TesoreriaDashboard: React.FC = () => {
  return (
    <div className="cm-container">
      <div className="cm-dashboard-layout">
        <section className="cm-dashboard-form">
          <FormularioEgresos />
        </section>

        <section className="cm-dashboard-tables">
          <div className="cm-dashboard-table-card">
            <HistoricoEgresos />
          </div>
        </section>
      </div>
    </div>
  );
};

export default TesoreriaDashboard;
