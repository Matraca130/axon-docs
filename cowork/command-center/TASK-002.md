# TASK-002: Fix BUG-001 (CRITICAL) - Mux Webhook resolution_tier

## Metadata
- **ID**: TASK-002
- **Created**: 2026-03-21
- **Priority**: 🔴 CRÍTICA
- **Status**: 🔴 ABIERTO
- **Sprint/Fase**: Fase 1 - Bug Fixing
- **Estimación**: 3 horas
- **Deadline**: 2026-03-24

## Agentes Asignados
| Agente | Rol | Estado | Última Actividad |
|--------|-----|--------|-----------------|
| infra-ai | Backend (AI Integration) | ABIERTO | 2026-03-21 |

## Descripción
Corregir mismatch entre campo esperado y campo recibido en webhook de Mux. El handler espera `resolution_tier` pero Mux v2 envía `max_resolution`. Esto bloquea todo el procesamiento de videos.

## Contexto
El servicio Mux procesa videos subidos para resúmenes. Cuando termina procesamiento, envía webhook con metadatos de video. Nuestro handler falla porque espera campo antiguo.

**Impacto:**
- 🔴 CRÍTICO: Video uploads completamente rotos
- Bloquea: Cualquier summary con video
- Usuarios afectados: Todos que intenten subir video a summary

## Criterios de Aceptación
- [x] Identificar archivo webhook handler
- [ ] Actualizar handler para usar `max_resolution`
- [ ] Agregar backward compatibility (si es necesario)
- [ ] Escribir tests para webhook payload
- [ ] Validar contra ejemplos reales de Mux
- [ ] Video uploads funcionan sin errores
- [ ] Metadatos se guardan en DB correctamente
- [ ] Tests pasan 100%

## Dependencias
- Depende de: Nada (es fix independiente)
- Bloquea a: Cualquier feature que use video

## Archivos Afectados
```
src/lib/webhooks/mux-handler.ts (PRINCIPAL)
├── Function: processMuxEvent()
├── Line: ~45 (field mapping)
└── Tests: tests/integration/mux-webhook.test.ts
```

## Pasos de Implementación

### 1. Investigación (30 minutos)
- [ ] Revisar código actual en `src/lib/webhooks/mux-handler.ts`
- [ ] Confirmar nombre de campo en payload actual
- [ ] Revisar Mux API v2 documentation
- [ ] Crear test payload basado en v2 spec

### 2. Implementación (1 hora)
- [ ] Cambiar `resolution_tier` → `max_resolution`
- [ ] Add try-catch para backward compatibility
- [ ] Log ambos campos si existen
- [ ] Actualizar DB field mapping

Código esperado:
```typescript
// BEFORE (BROKEN)
const resolutionTier = event.data.resolution_tier; // undefined!

// AFTER (FIXED)
const maxResolution = event.data.max_resolution; // "1080p"
// Opcionalmente map a familiar format:
const resolutionValue = mapMuxResolution(maxResolution); // 1080
```

### 3. Testing (1 hora)
- [ ] Unit test: webhook payload parsing
- [ ] Integration test: end-to-end video upload
- [ ] Test edge cases (missing fields, malformed JSON)
- [ ] Test both old y new format (backward compat)

Test cases:
```typescript
describe('Mux Webhook Handler', () => {
  test('processes max_resolution field correctly', async () => {
    const payload = {
      data: {
        status: 'ready',
        max_resolution: '1080p',
        video_id: 'vid_123'
      }
    };
    const result = await processMuxEvent(payload);
    expect(result.success).toBe(true);
    expect(result.resolution).toBe('1080p');
  });

  test('handles missing max_resolution gracefully', async () => {
    const payload = {
      data: {
        status: 'ready',
        video_id: 'vid_123'
      }
    };
    const result = await processMuxEvent(payload);
    expect(result.success).toBe(true);
    expect(result.resolution).toBeUndefined();
  });
});
```

### 4. Validation (30 minutos)
- [ ] Run full test suite
- [ ] Check CI/CD pipeline
- [ ] Manual test con Mux sandbox
- [ ] Check error logs para ningún regression

## Log de Progreso

### 2026-03-21 - STATUS: ABIERTO
- Tarea creada
- Asignada a: infra-ai agent
- Waiting for agent to start work

### [Agent Work Here - Update when work begins]

---

## Información Técnica

### Webhook Flow
```
User uploads video → Vercel API
  ↓
POST /upload → backend stores in Mux
  ↓
Mux processes video (async)
  ↓
Mux calls webhook: POST /webhooks/mux
  ↓
processMuxEvent() parses payload
  ↓
Handler updates DB with metadata ← BREAKS HERE
  ↓
UI polls GET /video/:id → shows ready
```

### Field Mapping
| Mux v1 | Mux v2 | Our DB | Meaning |
|--------|--------|--------|---------|
| resolution_tier | max_resolution | max_res_px | Max video resolution |
| - | height_px | height_px | Pixel height |
| - | width_px | width_px | Pixel width |

### Example Payloads

**Old (v1) - BROKEN:**
```json
{
  "type": "video.ready",
  "data": {
    "video_id": "vid_123",
    "resolution_tier": "1080p",
    "height": 1080,
    "width": 1920
  }
}
```

**New (v2) - CORRECT:**
```json
{
  "type": "video.ready",
  "data": {
    "video_id": "vid_123",
    "max_resolution": "1080p",
    "height_px": 1080,
    "width_px": 1920
  }
}
```

## Testing Checklist

- [ ] All webhook tests passing
- [ ] No TypeScript errors
- [ ] ESLint compliance
- [ ] 100% code coverage for handler function
- [ ] PR reviewed by quality-gate
- [ ] Merged to main
- [ ] Deployed to production

## Success Metrics

✅ **Definition of Done:**
- Video uploads no longer return 400 errors
- Webhook payload processed successfully
- Video metadata stored in database
- User sees "processing" → "ready" flow
- No regression in other endpoints

## Notas Importantes

1. **CRÍTICO:** Este fix bloquea all video functionality
2. **Backward Compat:** Si clientes aún envían v1 format, handle gracefully
3. **Logging:** Add logging para debugging future issues
4. **Monitoring:** Watch for webhook processing errors post-fix

## Recursos

- **Mux API v2:** https://docs.mux.com/api-reference/
- **Webhook Spec:** https://docs.mux.com/guides/video/configure-webhooks
- **Source:** `/sessions/nice-brave-hawking/mnt/AXON PROJECTO/axon-docs/known-bugs.md` (BUG-001)

---

**Próxima Acción:** infra-ai agent comienza investigación
**Tiempo Total Estimado:** 3 horas (30 + 60 + 60 + 30 = 180 minutos)
**Bloquea:** Cualquier deployment sin este fix
