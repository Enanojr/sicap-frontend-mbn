import React from "react";

import RegisterCobrador from "../../pages/Rcobradores/Rcobradores";
import TablaCobradores from "../../components/tablas/registro_cobradores";

const CobradoresPage: React.FC = () => {
  return (
    <div className="servicios-content-wrapper">
      <div className="cuentahabientes-wide">
        <RegisterCobrador />

        <TablaCobradores />
      </div>
    </div>
  );
};

export default CobradoresPage;
