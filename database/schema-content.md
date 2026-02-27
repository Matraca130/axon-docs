# Schema: Content

> Tables that hold educational content.
> **VERIFIED** against Query 2 constraint output.

## topics

| Column | Type | Nullable | Default | Notes |
|---|---|---|---|---|
| id | UUID | NO | gen_random_uuid() | PK |
| section_id | UUID | NO | | FK -> sections.id |
| name | TEXT | NO | | |
| order_index | INTEGER | NO | 0 | **Not `sort_order`!** |
| created_by | UUID | NO | | FK -> profiles.id |
| is_active | BOOLEAN | NO | true | |
| created_at | TIMESTAMPTZ | NO | now() | |
| updated_at | TIMESTAMPTZ | NO | now() | |

## summaries

Usually 1:1 with topics.

| Column | Type | Nullable | Default | Notes |
|---|---|---|---|---|
| id | UUID | NO | gen_random_uuid() | PK |
| topic_id | UUID | NO | | FK -> topics.id |
| title | TEXT | NO | | **Not nullable!** |
| content_markdown | TEXT | NO | | **Column is `content_markdown` not `content`!** |
| status | TEXT | NO | 'draft' | CHECK: `draft`, `published`, `rejected` |
| order_index | INTEGER | NO | 0 | |
| created_by | UUID | NO | | FK -> profiles.id |
| is_active | BOOLEAN | NO | true | |
| created_at | TIMESTAMPTZ | NO | now() | |
| updated_at | TIMESTAMPTZ | NO | now() | |

## chunks

| Column | Type | Nullable | Default | Notes |
|---|---|---|---|---|
| id | UUID | NO | gen_random_uuid() | PK |
| summary_id | UUID | NO | | FK -> summaries.id |
| content | TEXT | NO | | Chunk text |
| order_index | INTEGER | NO | 0 | **Not `sort_order`!** |
| metadata | JSONB | NO | '{}' | **Not nullable!** No `chunk_type` column |
| created_at | TIMESTAMPTZ | NO | now() | |

> Note: Chunks have NO `updated_at` or `created_by`.

## keywords

| Column | Type | Nullable | Default | Notes |
|---|---|---|---|---|
| id | UUID | NO | gen_random_uuid() | PK |
| summary_id | UUID | NO | | FK -> summaries.id |
| name | TEXT | NO | | The keyword/term |
| priority | INTEGER | NO | | **NOT NULL!** Integer value |
| created_by | UUID | NO | | FK -> profiles.id |
| is_active | BOOLEAN | NO | true | |
| created_at | TIMESTAMPTZ | NO | now() | |
| updated_at | TIMESTAMPTZ | NO | now() | |

> Note: NO `definition` column. NO `is_general` column. These were phantom fields.

## subtopics

**NEW TABLE** - child of keywords.

| Column | Type | Nullable | Default | Notes |
|---|---|---|---|---|
| id | UUID | NO | gen_random_uuid() | PK |
| keyword_id | UUID | NO | | FK -> keywords.id |
| name | TEXT | NO | | |
| order_index | INTEGER | NO | 0 | |
| is_active | BOOLEAN | NO | true | |
| created_at | TIMESTAMPTZ | NO | now() | |

## keyword_connections

**NEW TABLE** - links related keywords.

| Column | Type | Nullable | Default | Notes |
|---|---|---|---|---|
| id | UUID | NO | gen_random_uuid() | PK |
| keyword_a_id | UUID | NO | | FK -> keywords.id |
| keyword_b_id | UUID | NO | | FK -> keywords.id |
| created_at | TIMESTAMPTZ | NO | now() | |

**CHECK:** `keyword_a_id < keyword_b_id` (prevents duplicates)

## videos

| Column | Type | Nullable | Default | Notes |
|---|---|---|---|---|
| id | UUID | NO | gen_random_uuid() | PK |
| summary_id | UUID | NO | | FK -> summaries.id **NOT keyword_id!** |
| title | TEXT | NO | | |
| url | TEXT | NO | | |
| platform | TEXT | NO | | CHECK: `youtube`, `vimeo`, `other` |
| order_index | INTEGER | NO | 0 | |
| created_by | UUID | NO | | FK -> profiles.id |
| is_active | BOOLEAN | NO | true | |
| is_mux | BOOLEAN | NO | false | Mux-managed video? |
| status | TEXT | NO | | Video processing status |
| created_at | TIMESTAMPTZ | NO | now() | |
| updated_at | TIMESTAMPTZ | NO | now() | |

> Note: `max_resolution` column exists but is NULLABLE (no NOT NULL constraint). BUG-001 still applies.

## models_3d

**NEW TABLE** - 3D model viewer support.

| Column | Type | Nullable | Default | Notes |
|---|---|---|---|---|
| id | UUID | NO | gen_random_uuid() | PK |
| topic_id | UUID | NO | | FK -> topics.id |
| title | TEXT | NO | | |
| file_url | TEXT | NO | | URL to 3D file |
| file_format | TEXT | NO | | CHECK: `glb`, `gltf`, `obj`, `fbx` |
| order_index | INTEGER | NO | 0 | |
| created_by | UUID | NO | | FK -> profiles.id |
| is_active | BOOLEAN | NO | true | |
| created_at | TIMESTAMPTZ | NO | now() | |
| updated_at | TIMESTAMPTZ | NO | now() | |

## model_3d_pins

**NEW TABLE** - Pins on 3D models linked to keywords.

| Column | Type | Nullable | Default | Notes |
|---|---|---|---|---|
| id | UUID | NO | gen_random_uuid() | PK |
| model_id | UUID | NO | | FK -> models_3d.id |
| keyword_id | UUID | YES | | FK -> keywords.id |
| pin_type | TEXT | NO | | CHECK: `point`, `line`, `area` |
| geometry | JSONB | NO | | 3D coordinates |
| color | TEXT | NO | | |
| order_index | INTEGER | NO | 0 | |
| created_by | UUID | NO | | FK -> profiles.id |
| created_at | TIMESTAMPTZ | NO | now() | |
| updated_at | TIMESTAMPTZ | NO | now() | |

## model_layers / model_parts

**NOT ORPHAN** - belong to models_3d.

| Table | Key Columns | FK |
|---|---|---|
| model_layers | model_id, name, order_index | model_id -> models_3d.id |
| model_parts | model_id, name, order_index | model_id -> models_3d.id |

## summary_diagnostics

**NEW TABLE** - AI-generated analysis of summaries.

| Column | Type | Nullable | Default | Notes |
|---|---|---|---|---|
| id | UUID | NO | gen_random_uuid() | PK |
| summary_id | UUID | NO | | FK -> summaries.id |
| diagnostic_type | TEXT | NO | | CHECK: `general`, `depth_analysis`, `weak_areas`, `content_quality`, `comparative` |
| content | TEXT | NO | | |
| structured_data | JSONB | NO | | |
| requested_by | UUID | NO | | FK -> profiles.id |
| ai_generation_id | UUID | YES | | FK -> ai_generations.id |
| parent_diagnostic_id | UUID | YES | | Self-referencing FK |
| created_at | TIMESTAMPTZ | NO | now() | |

## Updated Hierarchy

```
Institution
  +-- Course
        +-- Semester
              +-- Section
                    +-- Topic
                          +-- Summary
                          |     +-- Chunks
                          |     +-- Keywords
                          |     |     +-- Subtopics
                          |     |     |     +-- BKT States (per student)
                          |     |     |     +-- Flashcards (also FK)
                          |     |     |     +-- Quiz Questions (also FK)
                          |     |     +-- Flashcards
                          |     |     +-- Keyword Connections
                          |     |     +-- Kw Prof Notes
                          |     |     +-- Kw Student Notes
                          |     |     +-- Model 3D Pins
                          |     +-- Videos
                          |     +-- Quizzes
                          |     +-- Quiz Questions
                          |     +-- Flashcards
                          |     +-- Summary Diagnostics
                          |     +-- Text Annotations (per student)
                          |     +-- Reading States (per student)
                          +-- Models 3D
                                +-- Model Layers
                                +-- Model Parts
                                +-- Model 3D Pins
                                +-- Model 3D Notes (per student)
```
