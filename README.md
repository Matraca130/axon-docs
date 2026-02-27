# Axon Docs

Documentacion central de la plataforma **Axon v4.4**.

Este repo es la **fuente de verdad** para arquitectura, schema de DB, rutas del backend, bugs conocidos, y contexto para sesiones de Figma Make.

## Repositorios del proyecto

| Repo | Proposito | Deploy |
|---|---|---|
| [numero1_sseki_2325_55](https://github.com/Matraca130/numero1_sseki_2325_55) | Frontend (React + Vite) | Vercel |
| [axon-backend](https://github.com/Matraca130/axon-backend) | Backend (Hono + Deno) | Deno Deploy via GitHub Actions |
| **axon-docs** (este repo) | Documentacion | Sin deploy |

## Estructura

```
axon-docs/
├── README.md                    <- Este archivo
├── PLATFORM-CONTEXT.md          <- Resumen ejecutivo (pegar en Figma Make)
├── KNOWN-BUGS.md                <- Bugs confirmados con severidad
├── API-MAP.md                   <- Rutas del backend + estado de conexion
├── database/                    <- (pendiente) Schema, constraints, RLS
│   ├── SCHEMA.md
│   ├── CONSTRAINTS.md
│   └── RLS-POLICIES.md
├── architecture/                <- (pendiente) Diagramas y flujos
│   ├── AUTH-FLOW.md
│   └── DATA-HIERARCHY.md
└── runbooks/                    <- (pendiente) Checklists y protocolos
    ├── HOTFIX-CHECKLIST.md
    └── MIGRATION-SAFETY.md
```

## Como usar con Figma Make

1. Abre la sesion de Figma Make
2. Abre el `.md` que necesitas de este repo
3. Copia el contenido
4. Pegalo como contexto en el chat
5. Figma Make ya tiene todo el contexto necesario

**Tip:** `PLATFORM-CONTEXT.md` es el archivo que deberias pegar en CADA sesion nueva.
