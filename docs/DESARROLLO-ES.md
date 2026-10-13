# 🛠️ Guía de Desarrollo — Convenciones y Mejores Prácticas

> Manual de referencia para mantener consistencia en el código y flujo de desarrollo del proyecto

---

## 📑 Tabla de Contenidos

1. [Convenciones de Código](#convenciones-de-código)
2. [Estructura de Ramas](#estructura-de-ramas)
3. [Flujo de Git](#flujo-de-git)
4. [Testing](#testing)
5. [Despliegue y CI/CD](#despliegue-y-cicd)
6. [Variables de Entorno](#variables-de-entorno)
7. [Debugging](#debugging)
8. [Checklist de Deploy](#checklist-de-deploy)

---

## 🎨 Convenciones de Código

### TypeScript / NestJS

#### Nombres de Archivos
```
✅ Correcto:
- user.entity.ts
- auth.service.ts
- create-note.dto.ts
- jwt-auth.guard.ts

❌ Incorrecto:
- User.ts
- authService.ts
- CreateNoteDTO.ts
```

#### Nombres de Clases
```typescript
// ✅ Correcto
export class UserEntity { }
export class AuthService { }
export class CreateNoteDto { }

// ❌ Incorrecto
export class user { }
export class authservice { }
export class createnote_dto { }
```

#### Nombres de Métodos
```typescript
// ✅ Correcto
async getUserById(id: string): Promise<User> { }
private hashPassword(password: string): string { }
async validateToken(token: string): Promise<boolean> { }

// ❌ Incorrecto
async get_user_by_id(id: string) { }
private HashPassword(password: string) { }
async validate_token(token: string) { }
```

#### Decoradores de NestJS
```typescript
// ✅ Correcto
@Controller('auth')
@Post('/login')
@UseGuards(JwtAuthGuard)
@Module({ imports: [], controllers: [], providers: [] })

// ❌ Incorrecto
@controller('auth')
@post('/login')
@useguards(JwtAuthGuard)
```

### Angular / TypeScript

#### Nombres de Componentes
```
✅ Correcto:
- login.component.ts
- note-list.component.ts
- auth.service.ts

❌ Incorrecto:
- LoginComponent.ts
- noteListComponent.ts
- authservice.ts
```

#### Selectores de Componentes
```typescript
// ✅ Correcto
@Component({
  selector: 'app-login',
  ...
})
export class LoginComponent { }

// ❌ Incorrecto
@Component({
  selector: 'Login',
  ...
})
export class loginComponent { }
```

---

## 🌿 Estructura de Ramas

### Nomenclatura

```
main              → Código en producción
develop           → Rama de integración (principal de desarrollo)
feature/*         → Nuevas características
feature/add-notes-filter
feature/s3-upload

bugfix/*          → Corrección de bugs
bugfix/auth-token-expiration
bugfix/note-deletion-error

hotfix/*          → Fixes urgentes para producción
hotfix/security-jwt-validation

docs/*            → Documentación
docs/api-endpoints
docs/setup-guide

refactor/*        → Refactorización de código
refactor/auth-module-structure

test/*            → Nuevos tests o cobertura
test/auth-service-coverage
```

### Ejemplo de Rama Válida
```
✅ Correcto:
git checkout -b feature/jwt-refresh-token
git checkout -b bugfix/note-creation-validation
git checkout -b hotfix/database-connection

❌ Incorrecto:
git checkout -b new-feature
git checkout -b fix
git checkout -b update
```

---

## 🔄 Flujo de Git

### Creando Nueva Característica

```bash
# 1. Actualizar develop
git checkout develop
git pull origin develop

# 2. Crear rama de feature
git checkout -b feature/mi-nueva-caracteristica

# 3. Hacer commits atómicos
git commit -m "feat: agregar validación de email"
git commit -m "feat: crear endpoint de registro"

# 4. Push a remote
git push origin feature/mi-nueva-caracteristica

# 5. Crear Pull Request en GitHub
# Ir a GitHub → Compare & pull request
```

### Mensajes de Commit

Usar formato convencional:

```
<tipo>(<alcance>): <descripción breve>

<descripción detallada (opcional)>

<referencias (opcional)>
```

#### Tipos válidos
```
feat:      Nueva característica
fix:       Corrección de bug
refactor:  Cambio en código sin nuevo feat o fix
test:      Agregar o actualizar tests
docs:      Cambios en documentación
style:     Cambios de formato (no lógica)
perf:      Mejora de rendimiento
chore:     Cambios en config/dependencias
```

#### Ejemplos
```
✅ Correcto:
git commit -m "feat(auth): agregar refresh token con JWT"
git commit -m "fix(notes): corregir validación de título"
git commit -m "refactor(sqs): optimizar consumidor Lambda"
git commit -m "test(backend): aumentar cobertura a 85%"
git commit -m "docs: actualizar guía de instalación"

❌ Incorrecto:
git commit -m "Updated things"
git commit -m "Fixed bug"
git commit -m "wip"
git commit -m "asdfgh"
```

---

## 🧪 Testing

### Backend (NestJS)

#### Ejecutar Tests
```bash
cd backend

# Tests unitarios
npm test

# Tests unitarios en watch mode
npm test -- --watch

# Tests E2E
npm run test:e2e

# Cobertura
npm test -- --coverage

# Coverage con reporte HTML
npm test -- --coverage --coverageReporters=html
# Abre coverage/index.html
```

#### Estructura de Tests
```
✅ Correcto:
src/
  auth/
    auth.service.ts
    auth.service.spec.ts      ← Test junto a código
  notes/
    notes.service.ts
    notes.service.spec.ts
```

#### Ejemplo de Test
```typescript
describe('AuthService', () => {
  let service: AuthService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AuthService],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should hash password correctly', async () => {
    const password = 'test123';
    const hashed = await service.hashPassword(password);
    expect(hashed).not.toBe(password);
  });
});
```

### Frontend (Angular)

#### Ejecutar Tests
```bash
cd frontend

# Tests unitarios
npm test

# Tests en watch mode
npm test -- --watch

# Tests con UI
npm run test:ui

# Coverage
npm run test:coverage
# Abre coverage/index.html
```

#### Cobertura Mínima Requerida
```
Statements   : 80%
Branches     : 75%
Functions    : 80%
Lines        : 80%
```

---

## 🚀 Despliegue y CI/CD

### GitHub Actions Workflows

Workflows automáticos en `.github/workflows/`:

```
backend-tests.yml         → Tests del backend
frontend-tests.yml        → Tests del frontend
lambda-package.yml        → Empaquetado de Lambda ZIP
terraform-validate.yml    → Validación de Terraform
```

### Ejecutar Workflows Manualmente
```
1. GitHub → Actions
2. Seleccionar workflow
3. "Run workflow"
4. Seleccionar rama (develop/main)
5. Click en "Run workflow"
```

### Verificación de Build Local

Antes de hacer push:

```bash
# Backend
cd backend
npm run build
npm test

# Frontend
cd frontend
npm run build
npm test

# Infraestructura
cd infra
terraform validate
terraform plan
```

---

## 🔐 Variables de Entorno

### Backend (`backend/.env`)
```env
# Server
NODE_ENV=development
PORT=3000

# Database
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=admin
DB_PASSWORD=admin123
DB_NAME=notesdb

# JWT
JWT_SECRET=tu-clave-secreta-super-segura-aqui
JWT_EXPIRATION=3600

# AWS / LocalStack
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=test
AWS_SECRET_ACCESS_KEY=test
S3_BUCKET=notes-bucket
SQS_QUEUE_URL=http://localhost:4566/000000000000/notes-queue
```

### Frontend (`frontend/src/environments/environment.ts`)
```typescript
export const environment = {
  production: false,
  apiUrl: 'http://localhost:3000'
};
```

### Infraestructura (`infra/.env` y `infra/infra/terraform.tfvars`)
```env
# .env
POSTGRES_USER=admin
POSTGRES_PASSWORD=admin123
POSTGRES_DB=notesdb
```

```hcl
# terraform.tfvars
aws_region             = "us-east-1"
environment            = "development"
db_host                = "postgres"
db_username            = "admin"
db_password            = "admin123"
lambda_architecture    = "arm64"
lambda_zip_path        = "../backend/lambda-dist/sqs-consumer.zip"
```

---

## 🐛 Debugging

### Backend (NestJS)

#### Logging
```typescript
import { Logger } from '@nestjs/common';

export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  async login(email: string, password: string) {
    this.logger.log(`Login attempt: ${email}`);
    this.logger.debug('Detailed debug info here');
    this.logger.error('Error message', new Error());
  }
}
```

#### Debug Mode
```bash
# Con node debugger
node --inspect-brk -r tsconfig-paths/register dist/main.js

# Con VS Code debugger
# .vscode/launch.json configurado
```

#### Inspeccionar LocalStack
```bash
# Ver logs
docker compose logs -f localstack

# Ver S3 buckets
aws --endpoint-url=http://localhost:4566 s3 ls

# Ver SQS queues
aws --endpoint-url=http://localhost:4566 sqs list-queues
```

### Frontend (Angular)

#### Logging
```typescript
export class NoteService {
  constructor(private http: HttpClient) {}

  getNotes(): Observable<Note[]> {
    console.log('Fetching notes...');
    return this.http.get<Note[]>('/api/notes').pipe(
      tap(notes => console.log('Notes fetched:', notes)),
      catchError(error => {
        console.error('Error fetching notes:', error);
        throw error;
      })
    );
  }
}
```

#### DevTools de Angular
```
Chrome DevTools → Console
Inspect elementos con elemento selector
Network tab para ver requests HTTP
```

---

## ✅ Checklist de Deploy

### Antes de hacer Push

- [ ] Tests locales pasan (`npm test`)
- [ ] Build local funciona (`npm run build`)
- [ ] Linting pasa (`npm run lint`)
- [ ] Variables de entorno están configuradas
- [ ] No hay console.log de debug en código
- [ ] Documentación está actualizada
- [ ] Commit messages son descriptivos

### Antes de Merge a Main

- [ ] PR tiene descripción clara
- [ ] Al menos 1 review aprobado
- [ ] Todos los checks de CI/CD pasaron
- [ ] No hay conflictos
- [ ] Branch está up-to-date con main

### Después de Deploy

- [ ] Verificar en producción que todo funciona
- [ ] Monitorear logs de errores
- [ ] Preparar hotfix si es necesario

---

## 📚 Referencias Útiles

### Documentación Oficial
- [NestJS Docs](https://docs.nestjs.com/)
- [Angular Docs](https://angular.io/docs)
- [Terraform Docs](https://www.terraform.io/docs)
- [Docker Docs](https://docs.docker.com/)

### Herramientas de Desarrollo
- **VS Code Extensions:**
  - Prettier - Code formatter
  - ESLint
  - GitLens
  - REST Client

### Comandos Útiles

```bash
# Limpiar node_modules y reinstalar
rm -rf node_modules package-lock.json
npm install

# Ver todos los branches
git branch -a

# Ver histórico de commits
git log --oneline -10

# Revert último commit (no publicado)
git reset --soft HEAD~1

# Stash cambios temporales
git stash
git stash pop
```

---

## 💬 Comunicación y Colaboración

### Antes de empezar a codear

1. Abre una **Issue** describiendo qué quieres hacer
2. Espera feedback de otros developers
3. Si es aprobado, crea rama feature basada en esa issue

### En Pull Requests

Incluye:
- Descripción clara del cambio
- Referencia a issue (`fixes #123`)
- Screenshots si es frontend
- Resultado de tests

Ejemplo:
```
## Descripción
Agrega validación de email en registro

## Cambios
- [x] Validar formato de email
- [x] Mostrar error si email existe
- [x] Tests unitarios

Fixes #42

## Cómo probar
1. Navega a /register
2. Intenta registrarse con email inválido
3. Verifica que aparece error
```

---

## 🎓 Aprendizaje Continuo

Recomendaciones:
- Leer código de otros en pull requests
- Documentar decisiones en commits
- Hacer code reviews constructivos
- Mantener documentación actualizada
- Refactorizar código viejo

---

**Última actualización:** Octubre 2026  
**Mantener este documento actualizado cuando cambie proceso o convenciones**
