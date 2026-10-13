# Frontend — Angular

> **Aplicación con Angular 21** para la plataforma de notas. Proporciona autenticación, enrutamiento protegido, gestión de notas e integración perfecta de carga de archivos.

Parte del monorepo [Portafolio-Notes-Platform](../README.md).  
**Repositorio de contrucción, planeación y desarrollo:** [Nando-Garcia/Lab-frontend](https://github.com/Nando-Garcia/Lab-frontend)

---

## Stack Tecnológico

- **Angular** 21 (componentes standalone)
- **TypeScript** 5.9
- **RxJS** ~7.8.0
- **SCSS** (estilos)
- **Vitest** 4.1 (testing unitario)
- **@testing-library/angular** (testing de componentes)
- **HttpClient** (comunicación con API)
- **Angular Router** (navegación y guards)

---

## Estructura del Proyecto

```
src/
├── app/
│   ├── app.ts                 # Componente raíz
│   ├── app.routes.ts          # Configuración de rutas
│   ├── app.config.ts          # Configuración de Angular
│   ├── app.html
│   ├── app.scss
│   ├── auth/
│   │   ├── login/             # Componente de login
│   │   │   ├── login.component.ts
│   │   │   ├── login.component.html
│   │   │   ├── login.component.scss
│   │   │   └── login.component.spec.ts
│   │   └── register/          # Componente de registro
│   ├── guards/
│   │   └── auth.guard.ts      # Protección de rutas
│   ├── interceptors/
│   │   └── auth.interceptor.ts # Inyección de token JWT
│   ├── models/
│   │   ├── auth.model.ts      # Interfaces de autenticación
│   │   └── note.model.ts      # Interfaces de notas
│   ├── services/
│   │   ├── auth.service.ts    # Llamadas API de autenticación
│   │   ├── auth.service.spec.ts
│   │   ├── notes.service.ts   # Llamadas API de notas
│   │   └── notes.service.spec.ts
│   ├── notes/
│   │   └── notes/             # Componente de gestión de notas
│   └── environments/
│       ├── environment.ts      # Configuración de desarrollo
│       └── environment.prod.ts # Configuración de producción
├── styles.scss                # Estilos globales
├── main.ts                    # Punto de entrada
├── index.html
└── test-setup.ts              # Configuración de tests

```

---

## Características Principales

- **Autenticación de Usuario** — Login y registro con tokens JWT
- **Rutas Protegidas** — Auth guard previene acceso no autorizado
- **Persistencia de Token** — Local storage para tokens JWT
- **Interceptor HTTP** — Inyecta automáticamente el token de autenticación en las solicitudes
- **CRUD de Notas** — Crear, leer, actualizar y eliminar notas
- **Carga de Archivos** — Adjuntar archivos a notas (enviados a S3 del backend)
- **UI Responsiva** — Diseño compatible con dispositivos móviles
- **Retroalimentación en Tiempo Real** — Estados de carga, manejo de errores, mensajes de éxito

---

## Empezar

### 1. Instalar Dependencias

```bash
npm install
```

### 2. Iniciar Servidor de Desarrollo

```bash
npm start
```

Abre el navegador en `http://localhost:4200`

### 3. Configuración de Entorno

Crea `src/environments/environment.ts`:

```typescript
export const environment = {
  apiUrl: 'http://localhost:3000'
};
```

---

## Testing

### Ejecutar Tests Unitarios

```bash
npm test
```

### Ejecutar Tests con Dashboard UI

```bash
npm run test:ui
```

### Generar Reporte de Cobertura

```bash
npm run test:coverage
```

---

## Compilar

### Compilación de Desarrollo

```bash
npm run build
```

### Compilación de Producción

```bash
ng build --configuration production
```

La salida se encuentra en `dist/Lab-frontend/`

---

## Flujo de la Aplicación

1. **El usuario llega** → Redirige a `/login` si no está autenticado
2. **El usuario inicia sesión** → Backend emite token JWT
3. **El token se almacena** → Local storage (`auth_token`)
4. **Interceptor activo** → Todas las solicitudes incluyen `Authorization: Bearer <token>`
5. **Se cargan las notas** → Se muestran desde `/api/notes`
6. **El usuario crea una nota** → POST a `/api/notes`
7. **El usuario adjunta un archivo** → Archivo subido a S3 a través del backend
8. **Se actualiza la nota** → La UI refleja los cambios inmediatamente
9. **El usuario cierra sesión** → Token se limpia, redirige a `/login`

---

## Integración de API

Todas las llamadas HTTP pasan por servicios `HttpClient`:

### AuthService
- `login(email, password)` → POST `/auth/login`
- `register(email, password)` → POST `/auth/register`
- `logout()` → Limpiar local storage

### NotesService
- `getNotes()` → GET `/notes`
- `createNote(note)` → POST `/notes`
- `deleteNote(id)` → DELETE `/notes/:id`
- `uploadFile(file)` → (mediante creación de nota con adjunto)

---

## Autenticación y Guards

**AuthGuard** (`src/app/guards/auth.guard.ts`):
- Verifica si existe token JWT en local storage
- Bloquea acceso a rutas protegidas si no está autenticado
- Redirige a login

**AuthInterceptor** (`src/app/interceptors/auth.interceptor.ts`):
- Intercepta todas las solicitudes HTTP
- Añade encabezado `Authorization: Bearer <token>`
- Maneja errores 401 (expiración de token)

---

## Componentes Standalone

Todos los componentes son standalone (Angular 14+), sin necesidad de declaraciones en `NgModule`:

```typescript
@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule, HttpClientModule, RouterModule],
  templateUrl: './login.component.html'
})
export class LoginComponent { }
```

---

## Gestión de Estado

- **Token JWT** → Local storage (`auth_token`)
- **Contexto de Usuario** → AuthService (singleton)
- **Lista de Notas** → NotesService (singleton)
- **Estado del Formulario** → Nivel de componente (decoradores `@Component`)

---

## Manejo de Errores

- Errores HTTP registrados en consola
- Mensajes de error amigables mostrados en UI
- Códigos de error específicos mapeados a mensajes UI (401 → redirige a login)
- En caso de fallo el servidor (backend) los gestiona mediante Cloudwatch y DLQ


---

## Licencia

MIT

---

## Documentación Relacionada

- [Documentación de Backend](../backend/README.md)
- [Configuración de Infraestructura](../infra/README.md)
- [Descripción General del Monorepo](../README.md)
