# Instructivo del Portal de Vacaciones HFC Construcciones

## Descripción General
Portal web para la gestión de vacaciones del personal de HFC Construcciones. Permite solicitar vacaciones, dar seguimiento a solicitudes, gestionar empleados y generar reportes. Diseñado para cumplir con la Ley Federal del Trabajo (LFT) en México, incluyendo las reformas de "Vacaciones Dignas" 2023.

---

## Módulo 1: Inicio de Sesión

### 1.1 Pantalla de Login
- **Acceso:** `/#/login`
- **Flujo:**
  1. Ingresar correo electrónico
  2. Presionar "Enviar código"
  3. Revisar la bandeja de entrada del correo (código de 6 dígitos, expira en 5 min)
  4. Ingresar el código y presionar "Iniciar sesión"
- **Nota:** Si el correo no existe en el sistema, se crea un usuario nuevo automáticamente.

### 1.2 Recuperación de Sesión
- Al recargar cualquier página, la sesión se mantiene activa por 8 horas.
- Si el token expira, se redirige automáticamente al login.

---

## Módulo 2: Dashboard (Inicio)

### 2.1 Tarjetas de Estadísticas
- **Total Empleados:** Número total de empleados registrados. → Clic: abre Gestión de Empleados
- **Solicitudes Firmadas:** Solicitudes que ya tienen PDF subido. → Clic: abre lista de Completas
- **Pendientes de Firmar:** Solicitudes aprobadas sin PDF. → Clic: abre lista de Pendientes

### 2.2 Calendario de Ausencias
- Muestra un calendario mensual con todos los empleados ausentes.
- **Color morado:** Empleado de vacaciones
- **Color naranja:** Día de descanso (arquitectos)
- Navegación entre meses con flechas ◀ ▶
- Número máximo de 3 nombres por celda, con "+N" para más.

### 2.3 Accesos Rápidos
- **Nueva Solicitud:** Abre la página para solicitar vacaciones.
- **Registrar Empleado:** Abre la gestión de empleados.
- **Ver Reportes:** Abre la sección de reportes.

---

## Módulo 3: Solicitud de Vacaciones

### 3.1 Selección de Empleado
- Barra de búsqueda con autocompletado.
- Al seleccionar, se muestra:
  - Nombre y departamento
  - Antigüedad
  - Días disponibles
  - Balance de días (Disponibles, Usados, Total Ley, Días/Semana)
  - Para arquitectos: Descansos usados en el mes (X / 2)

### 3.2 Selector de Tipo (Solo Arquitectos)
- **Vacaciones:** Usa días de vacaciones (LFT)
- **Día de Descanso:** No descuenta de vacaciones. Máximo 2 por mes.

### 3.3 Calendario para Vacaciones (Modo Rango)
- Calendario mensual visual tipo Airbnb
- **Selección:** Clic en fecha de inicio → clic en fecha de fin
- **Colores:**
  - **Rojo:** Días festivos (Año Nuevo, 1 Mayo, 16 Sep, 25 Dic, Constitución, Juárez, Revolución)
  - **Gris:** Días no laborables (sábados o domingos según jornada)
  - **Morado:** Rango seleccionado
- Vista previa del período: inicio, fin, días solicitados, saldo después, fecha de regreso
- El cálculo de días laborables excluye automáticamente festivos y fines de semana

### 3.4 Calendario para Día de Descanso (Modo Multi-select)
- Toca los días para marcarlos/desmarcarlos (máx. 2)
- **Color naranja:** Días seleccionados
- **Bloqueados:** Festivos y no laborables no se pueden seleccionar
- Se muestra contador: "X de 2 días seleccionados"

### 3.5 Envío de Solicitud
- Comentario opcional
- Botón "Enviar Solicitud"
- Para Vacaciones: queda en estado "Pendiente"
- Para Descanso: se auto-aprueba y aparece en el dashboard inmediatamente

---

## Módulo 4: Gestión de Empleados

### 4.1 Lista de Empleados
- Tabla con: Nombre, Departamento, Fecha Ingreso, Días Disponibles, Jornada, Acciones
- Los días disponibles se calculan automáticamente según la LFT (no se leen de BD)
- Buscador en tiempo real

### 4.2 Crear / Editar Empleado
- **Campos:** Nombre, Departamento, Fecha Ingreso, Fecha Nacimiento, Días por Semana, Días Disponibles, ¿Arquitecto?
- **Cálculo automático de días disponibles:**
  - Menos de 1 año: proporcional = 12 × (meses trabajados / 12)
  - 1 año cumplido: 12 días
  - 2 años: 14 días
  - 3 años: 16 días
  - 4 años: 18 días
  - 5 años: 20 días
  - 6+ años: 22 días
- Se muestra una vista previa de los días que le corresponden según LFT

### 4.3 Eliminar Empleado
- Confirmación con mensaje de advertencia
- Elimina todos los períodos y solicitudes asociadas

---

## Módulo 5: Reportes

### 5.1 Barra de Búsqueda General
- Campo de texto que filtra en tiempo real por: nombre, departamento, tipo, folio

### 5.2 Filtros
- **Tipo:** Todos / Vacaciones / Permisos
- **Empleado:** Selección individual
- **Mes:** Enero a Diciembre
- **Año:** 2024-2027
- **Desde / Hasta:** Rango de fechas específico
- **PDF:** Todos / Con PDF / Sin PDF
- Botón **Generar:** Ejecuta la consulta
- Botón **Limpiar:** Resetea todos los filtros

### 5.3 Resultados
- Tabla con: Folio, Empleado, Departamento, Tipo, Inicio, Fin, Días, Estado, PDF

### 5.4 Exportación
- **Excel (.xlsx):** Descarga con formato de columnas
- **PDF:** Documento horizontal con:
  - Encabezado morado "HFC CONSTRUCCIONES"
  - Tabla con filas alternadas
  - Paginación automática
  - Fecha de generación

---

## Módulo 6: Revisión de Solicitudes

### 6.1 Listos (PDF)
- Muestra solicitudes de vacaciones que ya tienen el PDF firmado subido
- Clic en cualquier fila → abre Solicitud de Vacaciones con ese empleado preseleccionado

### 6.2 Por Firmar
- Muestra solicitudes de vacaciones aprobadas o pendientes que NO tienen PDF
- Clic en cualquier fila → abre Solicitud de Vacaciones con ese empleado preseleccionado

---

## Módulo 7: Lógica de Negocio (LFT)

### 7.1 Cálculo de Días de Vacaciones
Basado en la Ley Federal del Trabajo (LFT) Art. 76-81:

| Años cumplidos | Días correspondientes |
|---|---|
| < 1 año | 12 × (meses/12) proporcional |
| 1 año | 12 días |
| 2 años | 14 días |
| 3 años | 16 días |
| 4 años | 18 días |
| 5 años | 20 días |
| 6+ años | 22 días |

### 7.2 Períodos Vacacionales
- Cada año de servicio genera un período vacacional
- El período tiene vigencia de 1 año (desde el aniversario hasta el siguiente aniversario)
- Los días no utilizados EXPIRAN (no son acumulables)
- Al cargar el resumen de un empleado, el sistema sincroniza automáticamente los períodos

### 7.3 Días de Descanso para Arquitectos
- Beneficio adicional de 2 días por mes
- Independientes de las vacaciones (no descuentan del saldo)
- Se reinician cada mes calendario
- Se auto-aprueban al solicitarse

### 7.4 Días Festivos (Art. 74 LFT)
Días considerados no laborables en el cálculo:
- 1 de enero (Año Nuevo)
- 1 de mayo (Día del Trabajo)
- 16 de septiembre (Independencia)
- 25 de diciembre (Navidad)
- Primer lunes de febrero (Constitución)
- Tercer lunes de marzo (Natalicio de Juárez)
- Tercer lunes de noviembre (Revolución Mexicana)
- 1 de octubre cada 6 años (Transición de gobierno)

---

## Módulo 8: Sincronización y Mantenimiento

### 8.1 Sincronización Automática
- Al cargar el resumen de un empleado, el sistema sincroniza sus períodos vacacionales
- Elimina períodos antiguos y crea los correctos según LFT
- Actualiza los días disponibles en la tabla de empleados

### 8.2 Sincronización Manual (Admin)
- Endpoint: `POST /api/admin/sync-all`
- Sincroniza TODOS los empleados de una vez
- Útil después de una migración o corrección masiva

### 8.3 Prescripción (Cron)
- Ejecución diaria a las 6:00 AM (solo en servidor local)
- Marca como "expirados" los períodos no utilizados
- Notificaciones de vencimiento a los 30, 15 y 7 días

---

## Módulo 9: Roles y Permisos

| Rol | Acceso |
|---|---|
| **admin** | Todas las funciones: gestión de empleados, usuarios, reportes, revisión |
| **User** | Solicitar vacaciones, ver su propio historial |
| Sin autenticación | Solo pantalla de login |

---

## Módulo 10: Navegación

### 10.1 Sidebar (Escritorio)
- Logo HFC con menú colapsable
- Secciones: Inicio, Vacaciones, RH, Admin
- Indicador de página activa

### 10.2 Bottom Navigation (Móvil)
- Aparece en pantallas menores a 960px
- Accesos principales: Inicio, Solicitar, Reportes

### 10.3 Rutas del Sistema

| Ruta | Descripción |
|---|---|
| `/#/login` | Inicio de sesión |
| `/#/dashboard` | Dashboard principal |
| `/#/vacaciones/solicitar` | Solicitar vacaciones |
| `/#/vacaciones/solicitar?employeeId=X` | Solicitar con empleado preseleccionado |
| `/#/vacaciones/revisar?filter=signed` | Solicitudes con PDF (Listos) |
| `/#/vacaciones/revisar?filter=pending` | Solicitudes sin PDF (Por Firmar) |
| `/#/admin/employees` | Gestión de empleados |
| `/#/rh/reportes` | Reportes |
| `/#/admin/users` | Gestión de usuarios |

---

## Arquitectura Técnica

### Frontend
- **Framework:** Vue 3 + TypeScript
- **UI:** Vuetify 3 (tema oscuro #0F172A)
- **Estado:** Pinia
- **Router:** Vue Router (hash mode)

### Backend
- **Runtime:** Express 5 + TypeScript
- **Base de datos:** MySQL (mysql2)
- **Autenticación:** JWT (8 horas de expiración)
- **Login:** Código de 6 dígitos por correo electrónico

### Despliegue
- **Plataforma:** Vercel (serverless)
- **Frontend:** Build estático con Vite
- **Backend:** Función serverless Node.js
