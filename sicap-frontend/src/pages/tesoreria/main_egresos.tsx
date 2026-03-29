import React, { useState } from "react";
import FormularioEgresos from "./formulario_egresos";
import TablaEgresos from "./tabla_egresos";

import "../../styles/styles.css";

const TesoreriaDashboard: React.FC = () => {
  const [refreshKey, setRefreshKey] = useState(0);

  const handleRefreshTable = () => {
    setRefreshKey((prev) => prev + 1);
  };

  return (
    <div className="cm-container cm-egresos-module">
      <div className="cm-egresos-shell">
        <div className="cm-egresos-stack">
          <section className="cm-egresos-form-wrap">
            <FormularioEgresos onSuccess={handleRefreshTable} />
          </section>

          <section className="cm-egresos-table-wrap">
            <TablaEgresos refreshKey={refreshKey} />
          </section>
        </div>
      </div>
    </div>
  );
};

export default TesoreriaDashboard;
