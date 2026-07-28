import { View, Text } from "@react-pdf/renderer";
import type { Style } from "@react-pdf/types";
import { FIRMANTES } from "./formato";

// ── Bloque de firmas ─────────────────────────────────────────────────────────
// El JSX es idéntico en todos los reportes; los estilos los aporta cada
// documento para no alterar su diseño particular.

interface EstilosFirmas {
  signaturesBox: Style;
  signatureItem: Style;
  signatureLine: Style;
  signatureRole: Style;
  signatureName: Style;
}

export function BloqueFirmas({ styles }: { styles: EstilosFirmas }) {
  return (
    <View style={styles.signaturesBox} wrap={false}>
      {FIRMANTES.map((firmante) => (
        <View key={firmante.rol} style={styles.signatureItem}>
          <View style={styles.signatureLine} />
          <Text style={styles.signatureRole}>{firmante.rol}</Text>
          <Text style={styles.signatureName}>{firmante.nombre}</Text>
        </View>
      ))}
    </View>
  );
}
