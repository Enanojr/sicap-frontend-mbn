# SICAP — Frontend

Frontend del **Sistema Integral de Control de Agua Potable (SICAP)**: SPA para la gestión del cobro de agua (padrón de cuentahabientes, pagos, cargos/deudas, descuentos, estados de cuenta, tesorería, cortes de caja, cierre anual y reportería).

> 📄 La documentación técnica completa (arquitectura, módulos, sistema de diseño, reglas de negocio y guía de onboarding con capturas) está en **`../Documentacion_Frontend.docx`** en la raíz del repositorio.

---

## Stack

| Capa | Tecnología |
|---|---|
| Build / Dev | Vite 7 |
| UI | React 19.2 (con React Compiler) |
| Lenguaje | TypeScript 5.9 (`strict`) |
| Enrutamiento | react-router-dom 7 (`createBrowserRouter`) |
| HTTP | Axios 1.12 (instancia central en `src/api_axios.ts`) |
| PDF | @react-pdf/renderer, jspdf, jspdf-autotable |
| UI/UX | lucide-react, react-icons, sweetalert2, recharts, react-date-range |
| Estilos | CSS plano global (`src/styles/styles.css`) — sin Tailwind ni CSS-in-JS |

**Estado / datos:** React Context (`AuthProvider`, `ThemeProvider`) + estado local. **No** hay Redux, Zustand ni React Query; el *fetching* es manual vía la capa de servicios.

---

## Puesta en marcha

**Requisitos:** Node.js ≥ 20.19 (recomendado 22 LTS o superior) y npm.

```bash
# 1. Instalar dependencias
npm install

# 2. Crear el archivo .env (ver siguiente sección) — IMPRESCINDIBLE

# 3. Levantar el entorno de desarrollo (http://localhost:5173)
npm run dev
```

### Variables de entorno

Crea un archivo **`.env`** en esta carpeta (`sicap-frontend/`):

```env
VITE_API_URL=http://localhost:8000
```

- `VITE_API_URL` es la URL base del backend. **Sin ella la aplicación no puede comunicarse con el servidor** (solo verás el login).
- No hay proxy de desarrollo configurado en `vite.config.ts`: el navegador llama directamente al backend, por lo que el **backend debe tener CORS habilitado** para el origen del frontend.

### Scripts

| Script | Descripción |
|---|---|
| `npm run dev` | Servidor de desarrollo con HMR (Vite, puerto 5173). |
| `npm run build` | Build de producción (`tsc -b && vite build`). |
| `npm run lint` | Análisis estático con ESLint. |
| `npm run preview` | Previsualiza el build de producción. |

---

## Dependencia del backend

Este frontend está **acoplado a un backend Django REST Framework** (autenticación JWT y paginación estándar DRF: `{ count, next, previous, results }`). Necesitas el backend corriendo y `VITE_API_URL` apuntándolo para desarrollar cualquier vista protegida.

- La utilidad `src/services/paginacion.ts → fetchAllPages()` recorre automáticamente todas las páginas siguiendo `next`, con caché en memoria opcional.
- ⚠️ **Inconsistencia de prefijo `/api/`:** la mayoría de los servicios llaman rutas sin prefijo (`/cuentahabientes/`, `/cargos/`), pero algunos lo incluyen (`/api/corte/generar/`, `/api/vista-deudores/`, `/api/vista-pagos/`). Confirma con el backend antes de crear un servicio nuevo.

---

## Autenticación

- Login: `POST /auth/login/` con `{ usuario, password }` → respuesta `{ access: <JWT>, cobrador: {...} }`.
- Se guarda en `localStorage`: `access` (JWT) y `usuario` (objeto del cobrador).
- `src/api_axios.ts` inyecta `Authorization: Bearer <access>` en cada petición y, ante un **401**, hace logout y redirige a `/login`. También reintenta automáticamente **429/503** con backoff exponencial.
- ⚠️ **No hay refresh token** (401 = logout total) y `isAuthenticated()` solo comprueba la presencia de las claves en `localStorage`, **no la expiración** del JWT.

---

## Estructura del proyecto

```
src/
├─ api_axios.ts        Cliente Axios central (JWT, reintentos, manejo de 401)
├─ main.tsx            Bootstrap: ThemeProvider > AuthProvider > RouterProvider
├─ routes/             rutas.tsx (createBrowserRouter) + ProtectedRoute.tsx
├─ services/           Capa de acceso a API por dominio (*.service.ts),
│                      contextos (auth/theme) y utilidades (paginacion.ts)
├─ components/         Reutilizables: tablas, forms, cards, navbar, layout, pdf
├─ pages/              Vistas por módulo (Login, Home, cargos, tesorería, …)
├─ styles/             styles.css (sistema visual global)
└─ assets/             Logo e íconos
```

### Roles

El rol vive en `usuario.role`. El **Panel de Administración** solo es visible para `admin`, `supervisor`, `tesorero_sr` y `tesorero_jr`. El rol `cobrador` opera pagos, consultas y cargos. La autorización real debe garantizarla el backend por endpoint.

---

## Convenciones

- **Retorno de servicios (inconsistente):** unos devuelven `{ success, data, errors }` (no lanzan) y otros retornan los datos y **lanzan excepción** en error. Revisa cada servicio antes de consumirlo.
- **Tabla reutilizable:** `ReusableTable` (`components/tablas/registros_general`) configurada con `columns` + `fetchData`.
- **Formulario reutilizable:** `FormularioReutilizable` con un objeto `FormConfig`.
- **Feedback:** SweetAlert2 es el estándar (éxito `#10b981`, error `#ef4444`, info `#3b82f6`).
- **Búsqueda:** patrón *debounce* (~400–500 ms) antes de llamar al backend con `?search=`.
- **Nomenclatura:** mezcla español/inglés; prefijo `R` = "Registro" (`Rcobradores`, `Rsector`).

### Cómo agregar un módulo nuevo

1. Crea el servicio en `src/services/<dominio>.service.ts` (interfaces + URL + funciones CRUD sobre `api_axios`).
2. Crea la vista en `src/pages/<Dominio>/` usando `ReusableTable` y/o `FormularioReutilizable`.
3. Registra la ruta en `src/routes/rutas.tsx` como hija de `RootLayout` (dentro de `ProtectedRoute`).
4. Agrega el acceso con una `WaterServiceCard` en el panel correspondiente (`Main_Cards` / `Admin_Cards` / `Tesorero_Cards`).
5. Reutiliza las clases de `styles/styles.css` para mantener consistencia.

---

## Calidad

- **No hay pruebas automatizadas** (sin runner ni script `test`); el QA es manual.
- Red de seguridad: TypeScript `strict` + ESLint. Corre `npm run lint` y `npm run build` en verde antes de abrir un PR.

## Deuda técnica conocida

- `src/App.tsx` es **código muerto** (boilerplate de Vite; nadie lo importa — el arranque real es `main.tsx`).
- `saldo_restante_cargo` llega como `string` en `cargos.service` pero como `number` en la vista de estado de cuenta.
- Módulos comentados/desactivados: Sectores, Colonias y Asignaciones (existen en código y rutas, pero no en `Admin_Cards`).
- Prefijo `/api/` inconsistente entre servicios (ver arriba).

---

## Git

Rama principal: `main`. Ramifica desde la rama que indique el equipo, ejecuta `lint` y `build` en verde, y describe en el PR los pasos de verificación manual (al no haber tests).
