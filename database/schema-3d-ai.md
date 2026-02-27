# Schema: 3D Models & AI

> 3D model viewer tables and AI generation tracking.
> **VERIFIED against Query 2 constraints data.**

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

## model_layers

| Column | Type | Nullable | Notes |
|---|---|---|---|
| id | UUID | NO | PK |
| model_id | UUID | NO | FK → models_3d.id |
| name | TEXT | NO | |
| description | TEXT | YES | |
| order_index | INTEGER | NO | |

## model_parts

| Column | Type | Nullable | Notes |
|---|---|---|---|
| id | UUID | NO | PK |
| model_id | UUID | NO | FK → models_3d.id |
| name | TEXT | NO | |
| description | TEXT | YES | |
| mesh_name | TEXT | YES | |
| layer_id | UUID | YES | FK → model_layers.id |
| keyword_id | UUID | YES | FK → keywords.id |
| color | TEXT | YES | |
| metadata | JSONB | YES | |
| order_index | INTEGER | NO | |

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
