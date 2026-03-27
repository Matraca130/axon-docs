-- ============================================================================
-- AGENT COMMAND CENTER - SUPABASE SQL SCHEMA
-- ============================================================================
-- This schema supports a multi-agent command center system where ~5 AI agents
-- work simultaneously on coordinated tasks with real-time progress tracking.
-- ============================================================================

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- ============================================================================
-- CORE TABLES
-- ============================================================================

-- AGENTS TABLE
-- Tracks all AI agents in the system with their current status and performance
CREATE TABLE agents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) NOT NULL UNIQUE,
  role VARCHAR(100) NOT NULL, -- e.g., "Backend Engineer", "Frontend Engineer", "DevOps"
  specialty VARCHAR(255), -- e.g., "Database Design", "React Components"
  status VARCHAR(20) NOT NULL DEFAULT 'inactive'
    CHECK (status IN ('active', 'inactive', 'busy')),
  current_task_id UUID, -- FK to tasks, can be NULL
  last_active_at TIMESTAMP WITH TIME ZONE,
  performance_score NUMERIC(5,2) DEFAULT 100.00, -- 0-100 scale
  metadata JSONB DEFAULT '{}'::jsonb, -- Additional agent config, capabilities, etc.
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE agents IS 'AI agents participating in the command center. Each agent can be assigned to tasks and has performance metrics tracked.';
COMMENT ON COLUMN agents.performance_score IS 'Score from 0-100 indicating agent reliability and task completion quality.';
COMMENT ON COLUMN agents.metadata IS 'JSON object storing agent-specific config: {languages: [...], frameworks: [...], max_concurrent_tasks: N}';

-- TASKS TABLE
-- Central task management with full context and dependencies
CREATE TABLE tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  priority VARCHAR(20) NOT NULL DEFAULT 'medium'
    CHECK (priority IN ('critical', 'high', 'medium', 'low')),
  status VARCHAR(20) NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'in_progress', 'completed', 'blocked')),
  phase VARCHAR(100), -- e.g., "MVP", "Phase 2", "Research"
  sprint VARCHAR(50), -- e.g., "Sprint 1", "Sprint 2"
  estimated_hours NUMERIC(8,2),
  deadline TIMESTAMP WITH TIME ZONE,
  context TEXT, -- Detailed background/reasoning for the task
  acceptance_criteria JSONB DEFAULT '[]'::jsonb, -- Array of acceptance criteria
  dependencies JSONB DEFAULT '[]'::jsonb, -- Array of task IDs this depends on
  files_affected TEXT[] DEFAULT '{}', -- Paths to files modified by this task
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE tasks IS 'Tasks managed by the command center. Each task tracks detailed context, dependencies, and progress.';
COMMENT ON COLUMN tasks.acceptance_criteria IS 'JSON array: [{id: "1", criteria: "Tests pass", completed: bool}, ...]';
COMMENT ON COLUMN tasks.dependencies IS 'JSON array: [{task_id: "uuid", required_before: timestamp}, ...]';
COMMENT ON COLUMN tasks.context IS 'Detailed context needed to understand and execute the task properly.';

-- TASK ASSIGNMENTS TABLE
-- Links agents to tasks with assignment-specific metadata
CREATE TABLE task_assignments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  agent_id UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  role VARCHAR(100), -- e.g., "Primary", "Reviewer", "Helper"
  status VARCHAR(20) NOT NULL DEFAULT 'assigned'
    CHECK (status IN ('assigned', 'started', 'completed', 'cancelled')),
  assigned_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE task_assignments IS 'Maps tasks to agents with assignment lifecycle tracking.';

CREATE UNIQUE INDEX idx_task_assignments_unique ON task_assignments(task_id, agent_id, role);

-- TASK PROGRESS LOG TABLE
-- Detailed log of progress and changes made by agents
CREATE TABLE task_progress_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  agent_id UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  message TEXT NOT NULL, -- Progress update message
  changes_made JSONB DEFAULT '{}'::jsonb, -- Detailed changelog
  files_modified TEXT[] DEFAULT '{}', -- Files touched in this update
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE task_progress_log IS 'Detailed audit trail of all progress made on tasks by agents.';
COMMENT ON COLUMN task_progress_log.changes_made IS 'JSON: {added: [...], modified: [...], removed: [...]}';

CREATE INDEX idx_task_progress_log_task_id ON task_progress_log(task_id);
CREATE INDEX idx_task_progress_log_agent_id ON task_progress_log(agent_id);
CREATE INDEX idx_task_progress_log_created_at ON task_progress_log(created_at DESC);

-- CHANGELOG TABLE
-- Tracks all code/content changes with optional Google Docs sync
CREATE TABLE changelog (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  agent_id UUID REFERENCES agents(id) ON DELETE SET NULL,
  task_id UUID REFERENCES tasks(id) ON DELETE SET NULL,
  change_type VARCHAR(50) NOT NULL
    CHECK (change_type IN ('added', 'modified', 'removed', 'fixed')),
  description TEXT NOT NULL,
  files_affected TEXT[] DEFAULT '{}',
  diff_summary TEXT, -- Brief diff or code change summary
  for_google_docs BOOLEAN DEFAULT true, -- Should this be synced to docs?
  synced_to_docs BOOLEAN DEFAULT false, -- Has it been synced?
  synced_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE changelog IS 'Complete change history with integration hooks for documentation systems.';
COMMENT ON COLUMN changelog.for_google_docs IS 'Flag indicating if this change should be documented in Google Docs.';

CREATE INDEX idx_changelog_task_id ON changelog(task_id);
CREATE INDEX idx_changelog_agent_id ON changelog(agent_id);
CREATE INDEX idx_changelog_created_at ON changelog(created_at DESC);
CREATE INDEX idx_changelog_synced ON changelog(for_google_docs, synced_to_docs);

-- CHECKPOINTS TABLE
-- Session checkpoints for agent state management and recovery
CREATE TABLE checkpoints (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id TEXT NOT NULL UNIQUE, -- Unique session identifier
  agent_id UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  task_id UUID REFERENCES tasks(id) ON DELETE SET NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'completed', 'abandoned')),
  summary TEXT, -- Brief summary of session progress
  state_snapshot JSONB DEFAULT '{}'::jsonb, -- Full state dump for recovery
  started_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  ended_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE checkpoints IS 'Session checkpoints for agent state persistence and recovery.';
COMMENT ON COLUMN checkpoints.state_snapshot IS 'JSON snapshot of agent state: {context: {}, working_dir: "", task_progress: {}, ...}';

CREATE INDEX idx_checkpoints_agent_id ON checkpoints(agent_id);
CREATE INDEX idx_checkpoints_task_id ON checkpoints(task_id);
CREATE INDEX idx_checkpoints_status ON checkpoints(status);

-- ROADMAP TABLE
-- Long-term planning and milestones
CREATE TABLE roadmap (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  phase VARCHAR(100) NOT NULL, -- e.g., "Phase 1", "Phase 2"
  milestone_name VARCHAR(255) NOT NULL,
  description TEXT,
  status VARCHAR(20) NOT NULL DEFAULT 'planned'
    CHECK (status IN ('planned', 'in_progress', 'completed', 'cancelled')),
  target_date TIMESTAMP WITH TIME ZONE,
  dependencies JSONB DEFAULT '[]'::jsonb, -- Array of dependent milestone IDs
  progress_percent NUMERIC(5,2) DEFAULT 0.00,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE roadmap IS 'High-level roadmap tracking phases and milestones for the project.';

CREATE INDEX idx_roadmap_phase ON roadmap(phase);
CREATE INDEX idx_roadmap_status ON roadmap(status);

-- IDEAS TABLE
-- Feature ideas and enhancement suggestions
CREATE TABLE ideas (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  category VARCHAR(100), -- e.g., "feature", "optimization", "bugfix"
  priority VARCHAR(20) DEFAULT 'medium'
    CHECK (priority IN ('critical', 'high', 'medium', 'low')),
  proposed_by VARCHAR(255), -- Agent name or user who proposed
  status VARCHAR(50) NOT NULL DEFAULT 'new'
    CHECK (status IN ('new', 'evaluating', 'approved', 'rejected', 'implemented')),
  votes INT DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE ideas IS 'Community/agent ideas for features and improvements.';

-- MEMORY TABLE
-- Distributed memory for agents to store learnings and patterns
CREATE TABLE memory (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  category VARCHAR(50) NOT NULL
    CHECK (category IN ('context', 'decision', 'learning', 'pattern')),
  key VARCHAR(255) NOT NULL, -- Searchable identifier
  value TEXT NOT NULL, -- The memory content
  metadata JSONB DEFAULT '{}'::jsonb, -- Additional context
  agent_id UUID REFERENCES agents(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE memory IS 'Distributed memory store for agents to persist learnings and patterns.';
COMMENT ON COLUMN memory.category IS 'context: domain info, decision: past decisions, learning: lessons learned, pattern: detected patterns';

CREATE INDEX idx_memory_agent_id ON memory(agent_id);
CREATE INDEX idx_memory_category ON memory(category);
CREATE INDEX idx_memory_key ON memory USING GIN (key gin_trgm_ops); -- Full-text search on keys

-- PROJECT DOCS TABLE
-- Central documentation repository
CREATE TABLE project_docs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title VARCHAR(255) NOT NULL,
  doc_type VARCHAR(50) NOT NULL
    CHECK (doc_type IN ('architecture', 'api', 'convention', 'overview', 'guide', 'troubleshooting')),
  content TEXT NOT NULL,
  version INT DEFAULT 1,
  last_updated_by VARCHAR(255), -- Agent name
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE project_docs IS 'Centralized project documentation authored and maintained by agents.';

-- ============================================================================
-- VIEWS FOR DASHBOARDS
-- ============================================================================

-- Active tasks view
CREATE OR REPLACE VIEW active_tasks_view AS
SELECT
  t.id,
  t.title,
  t.priority,
  t.status,
  t.phase,
  t.sprint,
  t.deadline,
  COUNT(ta.id)::INT AS assigned_agents,
  STRING_AGG(a.name, ', ') AS agent_names,
  t.estimated_hours,
  t.updated_at
FROM tasks t
LEFT JOIN task_assignments ta ON t.id = ta.task_id AND ta.status != 'cancelled'
LEFT JOIN agents a ON ta.agent_id = a.id
WHERE t.status IN ('pending', 'in_progress')
GROUP BY t.id, t.title, t.priority, t.status, t.phase, t.sprint, t.deadline, t.estimated_hours, t.updated_at
ORDER BY
  CASE WHEN t.priority = 'critical' THEN 0
       WHEN t.priority = 'high' THEN 1
       WHEN t.priority = 'medium' THEN 2
       ELSE 3 END,
  t.deadline NULLS LAST,
  t.updated_at DESC;

-- Agent workload view
CREATE OR REPLACE VIEW agent_workload_view AS
SELECT
  a.id,
  a.name,
  a.role,
  a.status,
  a.performance_score,
  COUNT(CASE WHEN ta.status IN ('assigned', 'started') THEN 1 END)::INT AS active_tasks,
  COUNT(CASE WHEN ta.status = 'completed' THEN 1 END)::INT AS completed_tasks,
  COALESCE(SUM(CASE WHEN ta.status IN ('assigned', 'started') THEN t.estimated_hours ELSE 0 END), 0) AS active_hours,
  a.last_active_at,
  a.updated_at
FROM agents a
LEFT JOIN task_assignments ta ON a.id = ta.agent_id
LEFT JOIN tasks t ON ta.task_id = t.id
GROUP BY a.id, a.name, a.role, a.status, a.performance_score, a.last_active_at, a.updated_at
ORDER BY a.status DESC, a.performance_score DESC;

-- Progress overview view
CREATE OR REPLACE VIEW progress_overview_view AS
SELECT
  t.id,
  t.title,
  t.status,
  t.priority,
  t.phase,
  ROUND((
    CASE
      WHEN t.status = 'completed' THEN 100
      WHEN t.status = 'blocked' THEN 0
      WHEN t.status = 'in_progress' THEN 50
      ELSE 25
    END
  )::NUMERIC, 2) AS estimated_progress,
  COUNT(ta.id)::INT AS team_size,
  COUNT(tpl.id)::INT AS updates_count,
  MAX(tpl.created_at) AS last_update,
  t.deadline,
  t.updated_at
FROM tasks t
LEFT JOIN task_assignments ta ON t.id = ta.task_id AND ta.status != 'cancelled'
LEFT JOIN task_progress_log tpl ON t.id = tpl.task_id
GROUP BY t.id, t.title, t.status, t.priority, t.phase, t.deadline, t.updated_at
ORDER BY t.updated_at DESC;

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================

CREATE INDEX idx_agents_status ON agents(status);
CREATE INDEX idx_agents_current_task_id ON agents(current_task_id);

CREATE INDEX idx_tasks_status ON tasks(status);
CREATE INDEX idx_tasks_priority ON tasks(priority);
CREATE INDEX idx_tasks_phase ON tasks(phase);
CREATE INDEX idx_tasks_sprint ON tasks(sprint);
CREATE INDEX idx_tasks_deadline ON tasks(deadline);
CREATE INDEX idx_tasks_created_at ON tasks(created_at DESC);

CREATE INDEX idx_task_assignments_agent_id ON task_assignments(agent_id);
CREATE INDEX idx_task_assignments_task_id ON task_assignments(task_id);
CREATE INDEX idx_task_assignments_status ON task_assignments(status);

-- ============================================================================
-- TRIGGERS FOR AUTOMATIC TIMESTAMP UPDATES
-- ============================================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER agents_updated_at BEFORE UPDATE ON agents
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER tasks_updated_at BEFORE UPDATE ON tasks
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER task_assignments_updated_at BEFORE UPDATE ON task_assignments
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER checkpoints_updated_at BEFORE UPDATE ON checkpoints
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER roadmap_updated_at BEFORE UPDATE ON roadmap
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER ideas_updated_at BEFORE UPDATE ON ideas
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER memory_updated_at BEFORE UPDATE ON memory
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER project_docs_updated_at BEFORE UPDATE ON project_docs
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- ROW LEVEL SECURITY POLICIES
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_progress_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE changelog ENABLE ROW LEVEL SECURITY;
ALTER TABLE checkpoints ENABLE ROW LEVEL SECURITY;
ALTER TABLE roadmap ENABLE ROW LEVEL SECURITY;
ALTER TABLE ideas ENABLE ROW LEVEL SECURITY;
ALTER TABLE memory ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_docs ENABLE ROW LEVEL SECURITY;

-- AGENTS: Agents can read all agents, but only update their own
CREATE POLICY agents_read_all ON agents
FOR SELECT USING (true);

CREATE POLICY agents_update_self ON agents
FOR UPDATE USING (auth.uid()::text = id::text)
WITH CHECK (auth.uid()::text = id::text);

-- TASKS: Agents can read all tasks
CREATE POLICY tasks_read_all ON tasks
FOR SELECT USING (true);

CREATE POLICY tasks_insert_all ON tasks
FOR INSERT WITH CHECK (true);

CREATE POLICY tasks_update_all ON tasks
FOR UPDATE USING (true);

-- TASK_ASSIGNMENTS: Agents can read and update assignments
CREATE POLICY task_assignments_read_all ON task_assignments
FOR SELECT USING (true);

CREATE POLICY task_assignments_insert_all ON task_assignments
FOR INSERT WITH CHECK (true);

CREATE POLICY task_assignments_update_all ON task_assignments
FOR UPDATE USING (true);

-- TASK_PROGRESS_LOG: All can read, agents can insert
CREATE POLICY task_progress_log_read_all ON task_progress_log
FOR SELECT USING (true);

CREATE POLICY task_progress_log_insert_all ON task_progress_log
FOR INSERT WITH CHECK (true);

-- CHANGELOG: All can read, agents can insert
CREATE POLICY changelog_read_all ON changelog
FOR SELECT USING (true);

CREATE POLICY changelog_insert_all ON changelog
FOR INSERT WITH CHECK (true);

-- CHECKPOINTS: All can read, agents can insert/update their own
CREATE POLICY checkpoints_read_all ON checkpoints
FOR SELECT USING (true);

CREATE POLICY checkpoints_insert_all ON checkpoints
FOR INSERT WITH CHECK (true);

CREATE POLICY checkpoints_update_own ON checkpoints
FOR UPDATE USING (auth.uid()::text = agent_id::text);

-- ROADMAP: All can read
CREATE POLICY roadmap_read_all ON roadmap
FOR SELECT USING (true);

-- IDEAS: All can read and insert
CREATE POLICY ideas_read_all ON ideas
FOR SELECT USING (true);

CREATE POLICY ideas_insert_all ON ideas
FOR INSERT WITH CHECK (true);

-- MEMORY: Agents can read all, but only update their own
CREATE POLICY memory_read_all ON memory
FOR SELECT USING (true);

CREATE POLICY memory_insert_all ON memory
FOR INSERT WITH CHECK (true);

CREATE POLICY memory_update_own ON memory
FOR UPDATE USING (agent_id IS NULL OR auth.uid()::text = agent_id::text);

-- PROJECT_DOCS: All can read
CREATE POLICY project_docs_read_all ON project_docs
FOR SELECT USING (true);

CREATE POLICY project_docs_insert_all ON project_docs
FOR INSERT WITH CHECK (true);

CREATE POLICY project_docs_update_all ON project_docs
FOR UPDATE USING (true);

-- ============================================================================
-- FOREIGN KEY CONSTRAINTS WITH CASCADE
-- ============================================================================

-- Ensure task_id in agents is valid
ALTER TABLE agents
ADD CONSTRAINT fk_agents_current_task
FOREIGN KEY (current_task_id) REFERENCES tasks(id) ON DELETE SET NULL;

-- ============================================================================
-- SEED DATA (Optional - for testing)
-- ============================================================================

-- Uncomment to seed initial agents:
/*
INSERT INTO agents (name, role, specialty, status, metadata)
VALUES
  ('Agent Alpha', 'Backend Engineer', 'Database Design', 'active', '{"languages": ["SQL", "Python"], "max_concurrent_tasks": 3}'),
  ('Agent Beta', 'Frontend Engineer', 'React Components', 'active', '{"languages": ["JavaScript", "TypeScript"], "max_concurrent_tasks": 2}'),
  ('Agent Gamma', 'DevOps Engineer', 'Infrastructure', 'active', '{"languages": ["Go", "Python"], "max_concurrent_tasks": 2}'),
  ('Agent Delta', 'QA Engineer', 'Testing & Automation', 'inactive', '{"languages": ["Python"], "max_concurrent_tasks": 4}'),
  ('Agent Epsilon', 'Tech Lead', 'Architecture', 'active', '{"languages": ["All"], "max_concurrent_tasks": 1}')
ON CONFLICT (name) DO NOTHING;
*/
