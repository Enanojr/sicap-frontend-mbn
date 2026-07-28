# docs/ — Documentación técnica del frontend

Este directorio contiene el generador de la documentación técnica del frontend SICAP y sus insumos.

## Contenido

| Ruta | Descripción |
|---|---|
| `generate_docx.js` | Script Node que compila la documentación y produce el Word. |
| `screenshots/` | Capturas de pantalla de las vistas principales (incrustadas en el documento). |
| `../Documentacion_Frontend.docx` | Documento generado (se escribe en la raíz del repositorio). |

## Cómo regenerar el documento

```bash
cd docs
npm install          # instala la librería 'docx' (solo la primera vez)
npm run generate     # equivale a: node generate_docx.js
```

El script escribe **`../Documentacion_Frontend.docx`** (en la raíz del repo).

**Requisitos:** Node.js ≥ 18.

## Notas

- Las capturas deben estar en `docs/screenshots/` con los nombres esperados
  (`login.png`, `panel_principal.png`, `panel_admin.png`, `cuentahabientes.png`,
  `registro_pago.png`, `gestion_cargos.png`, `estado_cuenta.png`, `descuentos.png`,
  `corte_caja.png`, `tesoreria.png`, `egresos.png`, `menu_reportes.png`,
  `consulta_pagos.png`). Si agregas o renombras capturas, actualiza el arreglo
  `vistas` dentro de `generate_docx.js`.
- El contenido (arquitectura, módulos, diseño, reglas de negocio y guía de
  onboarding) se edita directamente en `generate_docx.js`.
- Las rutas del script son **relativas** a este directorio, por lo que funciona
  independientemente de dónde esté clonado el repositorio.
- Al abrir el `.docx` en Word, actualiza la tabla de contenido
  (clic derecho → *Actualizar campos*) para regenerar la numeración de páginas.
