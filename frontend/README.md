# Frontend — Angular

> **Angular 21  application** for the notes platform. Provides authentication, protected routing, note management, and seamless file upload integration.

Part of the [Portafolio-Notes-Platform](../README.md) monorepo.  
**Construction, planning, and development repository:** [Nando-Garcia/Lab-frontend](https://github.com/Nando-Garcia/Lab-frontend)

---

## Tech Stack

- **Angular** 21 (standalone components)
- **TypeScript** 5.9
- **RxJS** ~7.8.0
- **SCSS** (styling)
- **Vitest** 4.1 (unit testing)
- **@testing-library/angular** (component testing)
- **HttpClient** (API communication)
- **Angular Router** (navigation & guards)

---

## Project Structure

```
src/
├── app/
│   ├── app.ts                 # Root component
│   ├── app.routes.ts          # Route configuration
│   ├── app.config.ts          # Angular config
│   ├── app.html
│   ├── app.scss
│   ├── auth/
│   │   ├── login/             # Login component
│   │   │   ├── login.component.ts
│   │   │   ├── login.component.html
│   │   │   ├── login.component.scss
│   │   │   └── login.component.spec.ts
│   │   └── register/          # Register component
│   ├── guards/
│   │   └── auth.guard.ts      # Route protection
│   ├── interceptors/
│   │   └── auth.interceptor.ts # JWT token injection
│   ├── models/
│   │   ├── auth.model.ts      # Auth interfaces
│   │   └── note.model.ts      # Note interfaces
│   ├── services/
│   │   ├── auth.service.ts    # Auth API calls
│   │   ├── auth.service.spec.ts
│   │   ├── notes.service.ts   # Notes API calls
│   │   └── notes.service.spec.ts
│   ├── notes/
│   │   └── notes/             # Notes management component
│   └── environments/
│       ├── environment.ts      # Development config
│       └── environment.prod.ts # Production config
├── styles.scss                # Global styles
├── main.ts                    # Bootstrap entry point
├── index.html
└── test-setup.ts              # Test configuration

```

---

## Key Features

- **User Authentication** — Login & registration with JWT tokens
- **Protected Routes** — Auth guard prevents unauthorized access
- **Token Persistence** — Local storage for JWT tokens
- **HTTP Interceptor** — Automatically injects auth token in requests
- **Note CRUD** — Create, read, update, delete notes
- **File Upload** — Attach files to notes (sent to backend S3)
- **Responsive UI** — Mobile-friendly design
- **Real-time Feedback** — Loading states, error handling, success messages

---

## Getting Started

### 1. Install Dependencies

```bash
npm install
```

### 2. Start Development Server

```bash
npm start
```

Open browser at `http://localhost:4200`

### 3. Environment Configuration

Create `src/environments/environment.ts`:

```typescript
export const environment = {
  apiUrl: 'http://localhost:3000'
};
```

---

## Testing

### Run Unit Tests

```bash
npm test
```

### Run Tests with UI Dashboard

```bash
npm run test:ui
```

### Generate Coverage Report

```bash
npm run test:coverage
```

---

## Build

### Development Build

```bash
npm run build
```

### Production Build

```bash
ng build --configuration production
```

Output is in `dist/Lab-frontend/`

---

## Application Flow

1. **User lands** → Redirect to `/login` if not authenticated
2. **User logs in** → Backend issues JWT token
3. **Token stored** → Local storage (`auth_token`)
4. **Interceptor active** → All requests include `Authorization: Bearer <token>`
5. **Notes loaded** → Display list from `/api/notes`
6. **User creates note** → POST to `/api/notes`
7. **User attaches file** → File uploaded to S3 via backend
8. **Note updated** → UI reflects changes immediately
9. **User logs out** → Token cleared, redirect to `/login`

---

## API Integration

All HTTP calls go through `HttpClient` services:

### AuthService
- `login(email, password)` → POST `/auth/login`
- `register(email, password)` → POST `/auth/register`
- `logout()` → Clear local storage

### NotesService
- `getNotes()` → GET `/notes`
- `createNote(note)` → POST `/notes`
- `deleteNote(id)` → DELETE `/notes/:id`
- `uploadFile(file)` → (via note creation with attachment)

---

## Authentication & Guards

**AuthGuard** (`src/app/guards/auth.guard.ts`):
- Checks if JWT token exists in local storage
- Blocks access to protected routes if not authenticated
- Redirects to login

**AuthInterceptor** (`src/app/interceptors/auth.interceptor.ts`):
- Intercepts all HTTP requests
- Adds `Authorization: Bearer <token>` header
- Handles 401 errors (token expiration)

---

## Standalone Components

All components are standalone (Angular 14+), no `NgModule` declarations needed:

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

## State Management

- **JWT Token** → Local storage (`auth_token`)
- **User Context** → AuthService (singleton)
- **Notes List** → NotesService (singleton)
- **Form State** → Component-level (`@Component` decorators)

---

## Error Handling

- HTTP errors logged to console
- User-friendly error messages displayed in UI
- Specific error codes mapped to UI messages (401 → redirect to login)
- Server failures handled by backend via CloudWatch and DLQ

---

## License

MIT

---

## Related Documentation

- [Backend API Documentation](../backend/README.md)
- [Infrastructure Setup](../infra/README.md)
- [Monorepo Overview](../README.md)
