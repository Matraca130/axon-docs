# Schema: 3D Models & AI

> 3D model viewer tables and AI generation tracking.
> **VERIFIED against Query 2 constraints + Query 3b column data.**

## models_3d

| Column | Type | Nullable | Notes |
|---|---|---|---|
| id | UUID | NO | PK |
| topic_id | UUID | NO | FK → topics.id |
| title | TEXT | NO | |
| file_url | TEXT | NO | |
| file_format | TEXT | NO | CHECK: `glb`, `gltf`, `obj`, `fbx` |
| description | TEXT | YES | |
| thumbnail_url | TEXT | YES | |
| order_index | INTEGER | NO | |
| created_by | UUID | NO | FK → profiles.id |
| is_active | BOOLEAN | NO | |
| metadata | JSONB | YES | |
| created_at | TIMESTAMPTZ | NO | |
| updated_at | TIMESTAMPTZ | NO | |

## model_layers

Grouping layers for 3D model parts (e.g., "Skeletal System", "Muscular System").

| Column | Type | Nullable | Default | Notes |
|---|---|---|---|---|
| id | UUID | NO | gen_random_uuid() | PK |
| model_id | UUID | NO | | FK → models_3d.id |
| name | TEXT | NO | | Layer display name |
| color_hex | TEXT | YES | | Hex color for layer group |
| order_index | INTEGER | NO | 0 | Sort position |
| created_at | TIMESTAMPTZ | YES | now() | |
| updated_at | TIMESTAMPTZ | YES | now() | |

> **No custom indexes** (only PK). Consider adding `idx_model_layers_model (model_id)` if queried frequently.

## model_parts

Individual parts/meshes of a 3D model that can be toggled, colored, and linked to keywords.

| Column | Type | Nullable | Default | Notes |
|---|---|---|---|---|
| id | UUID | NO | gen_random_uuid() | PK |
| model_id | UUID | NO | | FK → models_3d.id |
| name | TEXT | NO | | Part display name |
| layer_group | TEXT | YES | | Logical layer name (denormalized) |
| file_url | TEXT | YES | | Separate mesh file URL |
| color_hex | TEXT | YES | | Default hex color |
| opacity_default | REAL | YES | 1.0 | Default opacity (0.0–1.0) |
| is_visible_default | BOOLEAN | YES | true | Visible by default |
| order_index | INTEGER | NO | 0 | Sort position |
| created_at | TIMESTAMPTZ | YES | now() | |
| updated_at | TIMESTAMPTZ | YES | now() | |

> **No custom indexes** (only PK). Consider adding `idx_model_parts_model (model_id)` if queried frequently.

### Relationship Notes

- `model_layers` groups parts visually (color_hex for layer color).
- `model_parts` has `layer_group` (TEXT) which is a **denormalized** layer name — not a FK to model_layers.id.
- The original `schema-3d-ai.md` had `model_parts.layer_id FK → model_layers.id` but the actual DB uses `layer_group TEXT` instead. **The DB is the source of truth.**

## model_3d_pins

Annotation pins placed on 3D models.

| Column | Type | Nullable | Notes |
|---|---|---|---|
| id | UUID | NO | PK |
| model_id | UUID | NO | FK → models_3d.id |
| keyword_id | UUID | YES | FK → keywords.id |
| pin_type | TEXT | NO | CHECK: `point`, `line`, `area` |
| geometry | JSONB | NO | 3D position/shape data |
| title | TEXT | YES | |
| description | TEXT | YES | |
| color | TEXT | NO | |
| media_url | TEXT | YES | |
| order_index | INTEGER | NO | |
| created_by | UUID | NO | FK → profiles.id |
| created_at | TIMESTAMPTZ | NO | |
| updated_at | TIMESTAMPTZ | NO | |

## model_3d_notes

Student notes on 3D models.

| Column | Type | Nullable | Notes |
|---|---|---|---|
| id | UUID | NO | PK |
| student_id | UUID | NO | FK → profiles.id |
| model_id | UUID | NO | FK → models_3d.id |
| pin_id | UUID | YES | FK → model_3d_pins.id |
| note | TEXT | NO | |
| created_at | TIMESTAMPTZ | NO | |
| updated_at | TIMESTAMPTZ | NO | |

## ai_generations

Tracks AI content generation requests.

| Column | Type | Nullable | Notes |
|---|---|---|---|
| id | UUID | NO | PK |
| institution_id | UUID | NO | FK → institutions.id |
| requested_by | UUID | NO | FK → profiles.id |
| generation_type | TEXT | NO | CHECK: `flashcards`, `quiz`, `keywords`, `chat`, `summary_diagnostic` |
| source_summary_id | UUID | YES | FK → summaries.id |
| source_keyword_id | UUID | YES | FK → keywords.id |
| prompt | TEXT | YES | |
| items_generated | INTEGER | NO | |
| model_used | TEXT | YES | |
| created_at | TIMESTAMPTZ | NO | |

## summary_diagnostics

AI-generated analysis of summary quality.

| Column | Type | Nullable | Notes |
|---|---|---|---|
| id | UUID | NO | PK |
| summary_id | UUID | NO | FK → summaries.id |
| ai_generation_id | UUID | YES | FK → ai_generations.id |
| parent_diagnostic_id | UUID | YES | FK → summary_diagnostics.id (self-ref) |
| overall_score | NUMERIC | YES | |
| diagnostic_type | TEXT | NO | CHECK: `general`, `depth_analysis`, `weak_areas`, `content_quality`, `comparative` |
| content | TEXT | NO | |
| structured_data | JSONB | NO | |
| recommendations | JSONB | YES | |
| requested_by | UUID | NO | FK → profiles.id |
| created_at | TIMESTAMPTZ | NO | |

---

## Table Count: 7

models_3d, model_layers, model_parts, model_3d_pins, model_3d_notes, ai_generations, summary_diagnostics
