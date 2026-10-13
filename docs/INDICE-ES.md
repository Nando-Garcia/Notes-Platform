# 📚 Documentación en Español — Plataforma de Notas Portafolio

Bienvenido a la documentación completa en español del proyecto **Portafolio-Notes-Platform**.

Esta carpeta contiene manuales detallados de cada módulo del proyecto para facilitar tu comprensión y desarrollo.

---

## 📖 Índice de Documentos

### 🏠 [README Principal — README-ES.md](./README-ES.md)
Visión general completa del proyecto:
- Stack tecnológico
- Arquitectura general
- Estructura del monorepo
- Guía de inicio rápido
- Flujo completo de instalación (infraestructura, backend, frontend)
- Enlaces a repositorios públicos en GitHub

**Ideal para:** Entender la estructura general del proyecto y empezar

---

### 🎨 [Frontend — FRONTEND-ES.md](./FRONTEND-ES.md)
Documentación detallada de la aplicación Angular:
- Stack y dependencias
- Estructura de componentes y servicios
- Características principales (autenticación, CRUD de notas, carga de archivos)
- Guía de desarrollo local
- Testing y cobertura
- Flujo de autenticación y guards
- Integración de API

**Ideal para:** Trabajar con el frontend Angular

---

### 🔧 [Backend — BACKEND-ES.md](./BACKEND-ES.md)
Documentación completa de la API NestJS:
- Stack tecnológico
- Estructura de módulos (auth, notes, sqs, lambda)
- Endpoints de API (autenticación, CRUD de notas)
- Flujo de autenticación JWT
- Integración con S3 y carga de archivos
- Procesamiento asincrónico (SQS + Lambda)
- Testing unitario y E2E
- Esquema de base de datos

**Ideal para:** Desarrollar y mantener el API backend

---

### ☁️ [Infraestructura — INFRAESTRUCTURA-ES.md](./INFRAESTRUCTURA-ES.md)
Documentación de infraestructura como código:
- Stack (Terraform, LocalStack, Docker, PostgreSQL)
- Configuración de Docker Compose
- Módulos Terraform (S3, SQS, Lambda, IAM, CloudWatch)
- Guía de instalación paso a paso
- Variables y configuración
- Comandos comunes
- Solución de problemas
- Consideraciones de seguridad (dev vs producción)

**Ideal para:** Configurar y gestionar la infraestructura local

---

## 🚀 Inicio Rápido

### Para empezar rápidamente:

1. Lee [README Principal](./README-ES.md) para entender la arquitectura
2. Sigue la sección **"Inicio Rápido"** para levantar todo
3. Consulta los documentos específicos según qué módulo necesites trabajar

### Instalación paso a paso:

```bash
# 1. Clonar proyecto
git clone https://github.com/Nando-Garcia/Portafolio-Notes-Platform.git
cd Portafolio-Notes-Platform

# 2. Preparar archivos de entorno
cp backend/.env.example backend/.env
cp infra/.env.example infra/.env
cp infra/infra/terraform.tfvars.example infra/infra/terraform.tfvars

# 3. Levantar infraestructura
cd infra
docker compose up -d
terraform init
terraform apply -var="lambda_zip_path=../backend/lambda-dist/sqs-consumer.zip" -var="lambda_architecture=arm64"

# 4. Ejecutar backend
cd ../backend
npm install
npm run start:dev

# 5. Ejecutar frontend
cd ../frontend
npm install
npm start
```

---

## 📋 Matriz de Referencia Rápida

| Necesito... | Consulta | Ubicación |
|------------|----------|-----------|
| Entender la arquitectura | README Principal | README-ES.md |
| Trabajar con Angular | Documentación Frontend | FRONTEND-ES.md |
| Trabajar con NestJS | Documentación Backend | BACKEND-ES.md |
| Configurar Docker/Terraform | Documentación Infraestructura | INFRAESTRUCTURA-ES.md |
| Ver endpoints de API | Sección API del Backend | BACKEND-ES.md#-endpoints-de-api |
| Entender autenticación | Documentación Backend o Frontend | BACKEND-ES.md / FRONTEND-ES.md |
| Configurar AWS local | Documentación Infraestructura | INFRAESTRUCTURA-ES.md |
| Testing del proyecto | Cada documentación de módulo | *-ES.md#-testing |

---

## 🔗 Enlaces Importantes

### Repositorios Públicos (para ver construcción, commits, PRs)

- **Frontend:** [Nando-Garcia/Lab-frontend](https://github.com/Nando-Garcia/Lab-frontend)
- **Backend:** [Nando-Garcia/Lab-backend](https://github.com/Nando-Garcia/Lab-backend)
- **Infraestructura:** [Nando-Garcia/Lab-infra](https://github.com/Nando-Garcia/Lab-infra)

### Documentación Original en Inglés

Si necesitas documentación en inglés, consulta los archivos README en la raíz del proyecto:
- [README.md](../README.md) — Resumen del proyecto
- [backend/README.md](../backend/README.md) — Backend
- [frontend/README.md](../frontend/README.md) — Frontend
- [infra/README.md](../infra/README.md) — Infraestructura

---

## 💡 Tips y Trucos

### Para desarrollo local eficiente:

**Terminal 1 — Infraestructura:**
```bash
cd infra
docker compose up -d
```

**Terminal 2 — Backend:**
```bash
cd backend
npm run start:dev
```

**Terminal 3 — Frontend:**
```bash
cd frontend
npm start
```

Esto te permite ver logs de cada módulo en paralelo.

### Verificar que todo funciona:

```bash
# Salud del backend
curl http://localhost:3000/health

# Frontend en navegador
http://localhost:4200
```

---

## 🆘 Soporte y Troubleshooting

### Problemas comunes:

- **Puerto 3000 en uso** → Cambia `PORT` en backend/.env
- **Puerto 4200 en uso** → Cambia puerto en `ng serve --port XXXX`
- **Docker no funciona** → Reinicia Docker Desktop
- **Terraform falla** → Verifica rutas en `.tfvars`

Para soluciones específicas, consulta:
- Sección "🐛 Solución de Problemas" en cada documentación

---

## 📝 Notas Importantes

- ✅ Todos los datos sensibles (contraseñas, tokens) están **EXCLUIDOS** de Git
- ✅ LocalStack emula AWS localmente — **no requiere cuenta de AWS**
- ✅ Cada módulo tiene su propia documentación y configuración independiente
- ✅ Los repositorios públicos en GitHub contienen el historial completo de construcción

---

## 📄 Licencia

MIT — Libre para usar, modificar y distribuir

---

**Última actualización:** Octubre 2026  
**Autor:** Nando Garcia  
**Contacto:** Ver repositorios públicos en GitHub

---

¿Preguntas? Consulta la documentación específica del módulo o visita los repositorios públicos para ver issues, discussions y más detalles.

¡Feliz desarrollo! 🚀
