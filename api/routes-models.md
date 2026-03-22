# API Routes: 3D Models

> Models, Pins, Notes, Layers, Parts, and File Upload.
>
> **Verified against:** `routes-models.tsx`
>
> **Last verified:** 2026-03-06

---

## Models 3D

| Method | Endpoint | Query Params | Response |
|---|---|---|---|
| GET | `/models-3d` | `topic_id` (required) | Paginated |
| GET | `/models-3d/:id` | | Single |
| POST | `/models-3d` | | Single (201) |
| PUT | `/models-3d/:id` | | Single |
| DELETE | `/models-3d/:id` | | Single (soft-delete) |
| PUT | `/models-3d/:id/restore` | | Single (restore) |

**Required fields:** `title`, `file_url`

## Model 3D Pins

| Method | Endpoint | Query Params | Response |
|---|---|---|---|
| GET | `/model-3d-pins` | `model_id` (required), `keyword_id` (optional) | Paginated |
| GET | `/model-3d-pins/:id` | | Single |
| POST | `/model-3d-pins` | | Single (201) |
| PUT | `/model-3d-pins/:id` | | Single |
| DELETE | `/model-3d-pins/:id` | | Hard delete |

**Required fields:** `geometry`

## Model 3D Notes (Student)

| Method | Endpoint | Query Params | Response |
|---|---|---|---|
| GET | `/model-3d-notes` | `model_id` (required) | Paginated (user-scoped) |
| GET | `/model-3d-notes/:id` | | Single |
| POST | `/model-3d-notes` | | Single (201) |
| PUT | `/model-3d-notes/:id` | | Single |
| DELETE | `/model-3d-notes/:id` | | Single (soft-delete) |
| PUT | `/model-3d-notes/:id/restore` | | Single (restore) |

**Required fields:** `note`
**Scoped to user:** `student_id`

## Model Layers (NEW - 2026-03-06)

Grouping layers for model parts (e.g. "Skeletal System", "Muscular System").

| Method | Endpoint | Query Params | Response |
|---|---|---|---|
| GET | `/model-layers` | `model_id` (required) | Paginated |
| GET | `/model-layers/:id` | | Single |
| POST | `/model-layers` | | Single (201) |
| PUT | `/model-layers/:id` | | Single |
| DELETE | `/model-layers/:id` | | Hard delete |

**Required fields:** `name`
**Create fields:** `name`, `color_hex`, `order_index`
**Update fields:** `name`, `color_hex`, `order_index`

## Model Parts (NEW - 2026-03-06)

Individual meshes/parts of a 3D model that can be toggled, colored, and assigned to layers.

| Method | Endpoint | Query Params | Response |
|---|---|---|---|
| GET | `/model-parts` | `model_id` (required) | Paginated |
| GET | `/model-parts/:id` | | Single |
| POST | `/model-parts` | | Single (201) |
| PUT | `/model-parts/:id` | | Single |
| DELETE | `/model-parts/:id` | | Hard delete |

**Required fields:** `name`
**Create fields:** `name`, `layer_group`, `file_url`, `color_hex`, `opacity_default`, `is_visible_default`, `order_index`
**Update fields:** `name`, `layer_group`, `file_url`, `color_hex`, `opacity_default`, `is_visible_default`, `order_index`

## Upload Model 3D (NEW - 2026-03-06)

Upload .glb/.gltf files to Supabase Storage.

| Method | Endpoint | Content-Type | Response |
|---|---|---|---|
| POST | `/upload-model-3d` | `multipart/form-data` | `{ data: { file_url, file_size_bytes, file_format } }` (201) |

**Form field:** `file` (the .glb or .gltf file)
**Validation:**
- Extension: `.glb` or `.gltf` only
- Size: max 100MB
- GLB magic bytes validated for `.glb` files

**Storage bucket:** `axon-models-3d` (public, auto-created)
**Returns:** public URL for the uploaded file

### Upload + Create Flow (frontend)

```
1. POST /upload-model-3d (multipart) → { file_url, file_size_bytes, file_format }
2. POST /models-3d { topic_id, title, file_url, file_format } → Model3D record
```

## Institution Scoping

All endpoints use automatic institution scoping via `crud-factory.ts`:
- `model_id` → `models_3d` → `topic_id` → ... → `institution_id`
- Read: `ALL_ROLES`
- Write: `CONTENT_WRITE_ROLES` (owner, admin, professor)
- Notes: user-scoped (`student_id`), no institution check
