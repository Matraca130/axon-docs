# Agent Command Center - Supabase Sync Guide

This guide explains how AI agents can synchronize their local Markdown files to Supabase and retrieve data back for offline work.

## Table of Contents

1. [Setup](#setup)
2. [Core Concepts](#core-concepts)
3. [Syncing Tasks from Markdown](#syncing-tasks-from-markdown)
4. [Syncing Progress Updates](#syncing-progress-updates)
5. [Syncing Changes & Changelog](#syncing-changes--changelog)
6. [Retrieving Data from Supabase](#retrieving-data-from-supabase)
7. [Full Sync Workflow](#full-sync-workflow)
8. [Best Practices](#best-practices)
9. [Troubleshooting](#troubleshooting)

---

## Setup

### Prerequisites

- Supabase project with the schema initialized
- Node.js with `@supabase/supabase-js` client
- Local Markdown files organized by type (tasks, progress, changelog, docs)

### Installation

```bash
npm install @supabase/supabase-js
# or
yarn add @supabase/supabase-js
```

### Initialize Supabase Client

Create `supabaseClient.js`:

```javascript
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || 'https://your-project.supabase.co';
const supabaseKey = process.env.SUPABASE_ANON_KEY || 'your-anon-key';

export const supabase = createClient(supabaseUrl, supabaseKey);

// For authenticated operations (agent-specific)
export const createAuthenticatedClient = (jwtToken) => {
  return createClient(supabaseUrl, supabaseKey, {
    auth: {
      persistSession: false,
    },
    headers: {
      Authorization: `Bearer ${jwtToken}`,
    },
  });
};
```

---

## Core Concepts

### Markdown File Structure

Organize your local files by type:

```
project/
├── tasks/
│   ├── 2024-01-task-1.md
│   ├── 2024-01-task-2.md
│   └── sprint-1/
│       └── task-3.md
├── progress/
│   ├── 2024-01-20-update.md
│   └── weekly-summary.md
├── changelog/
│   ├── 2024-01-changes.md
│   └── features.md
└── docs/
    ├── architecture.md
    ├── api.md
    └── conventions.md
```

### YAML Frontmatter Format

All Markdown files should include YAML frontmatter for metadata:

```markdown
---
id: task-uuid-or-title
type: task
title: "Feature X Implementation"
status: in_progress
priority: high
phase: Phase 1
sprint: Sprint 5
estimated_hours: 8
deadline: 2024-02-15
agent: Agent Alpha
sync_timestamp: 2024-01-20T15:30:00Z
---

## Description

Task description here...

## Acceptance Criteria

- [ ] Criterion 1
- [ ] Criterion 2
- [ ] Criterion 3
```

---

## Syncing Tasks from Markdown

### Parse Markdown Task Files

Create `taskSyncHandler.js`:

```javascript
import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import { supabase } from './supabaseClient.js';

/**
 * Parse a single Markdown task file
 */
export const parseTaskMarkdown = (filePath) => {
  const fileContent = fs.readFileSync(filePath, 'utf-8');
  const { data: frontmatter, content } = matter(fileContent);

  return {
    id: frontmatter.id || null,
    title: frontmatter.title,
    description: content.trim(),
    priority: frontmatter.priority || 'medium',
    status: frontmatter.status || 'pending',
    phase: frontmatter.phase,
    sprint: frontmatter.sprint,
    estimated_hours: frontmatter.estimated_hours,
    deadline: frontmatter.deadline ? new Date(frontmatter.deadline) : null,
    agent: frontmatter.agent,
    acceptance_criteria: extractAcceptanceCriteria(content),
    dependencies: frontmatter.dependencies || [],
    files_affected: frontmatter.files_affected || [],
    sync_timestamp: frontmatter.sync_timestamp || new Date().toISOString(),
  };
};

/**
 * Extract acceptance criteria from markdown checkboxes
 */
const extractAcceptanceCriteria = (content) => {
  const checkboxRegex = /^- \[.\] (.+)$/gm;
  const matches = [...content.matchAll(checkboxRegex)];

  return matches.map((match, index) => ({
    id: String(index + 1),
    criteria: match[1],
    completed: match[0].includes('[x]') || match[0].includes('[X]'),
  }));
};

/**
 * Upload a task from Markdown to Supabase
 * Creates new or updates existing task based on ID
 */
export const syncTaskToSupabase = async (taskData, agentId) => {
  try {
    let result;

    if (taskData.id) {
      // Update existing task
      result = await supabase
        .from('tasks')
        .update({
          title: taskData.title,
          description: taskData.description,
          priority: taskData.priority,
          status: taskData.status,
          phase: taskData.phase,
          sprint: taskData.sprint,
          estimated_hours: taskData.estimated_hours,
          deadline: taskData.deadline,
          acceptance_criteria: taskData.acceptance_criteria,
          dependencies: taskData.dependencies,
          files_affected: taskData.files_affected,
          updated_at: new Date().toISOString(),
        })
        .eq('id', taskData.id)
        .select();
    } else {
      // Create new task
      result = await supabase
        .from('tasks')
        .insert([
          {
            title: taskData.title,
            description: taskData.description,
            priority: taskData.priority,
            status: taskData.status,
            phase: taskData.phase,
            sprint: taskData.sprint,
            estimated_hours: taskData.estimated_hours,
            deadline: taskData.deadline,
            acceptance_criteria: taskData.acceptance_criteria,
            dependencies: taskData.dependencies,
            files_affected: taskData.files_affected,
          },
        ])
        .select()
        .single();
    }

    if (result.error) {
      throw new Error(`Sync failed: ${result.error.message}`);
    }

    console.log(`✓ Task synced: ${result.data.title} (${result.data.id})`);
    return result.data;
  } catch (error) {
    console.error(`✗ Error syncing task: ${error.message}`);
    throw error;
  }
};

/**
 * Bulk sync all task Markdown files from a directory
 */
export const syncAllTasksFromDirectory = async (directoryPath, agentId) => {
  const files = fs.readdirSync(directoryPath).filter(f => f.endsWith('.md'));
  const results = [];

  for (const file of files) {
    const filePath = path.join(directoryPath, file);
    try {
      const taskData = parseTaskMarkdown(filePath);
      const synced = await syncTaskToSupabase(taskData, agentId);
      results.push({ status: 'success', file, data: synced });
    } catch (error) {
      results.push({ status: 'error', file, error: error.message });
    }
  }

  return results;
};
```

### Usage Example

```javascript
import { syncTaskToSupabase, parseTaskMarkdown } from './taskSyncHandler.js';

// Parse and sync a single task
const taskData = parseTaskMarkdown('./tasks/feature-x.md');
const agentId = 'your-agent-uuid';
const synced = await syncTaskToSupabase(taskData, agentId);

console.log('Synced task:', synced);
```

---

## Syncing Progress Updates

### Create Progress Log Entry

Create `progressSyncHandler.js`:

```javascript
import fs from 'fs';
import matter from 'gray-matter';
import { supabase } from './supabaseClient.js';

/**
 * Parse a progress update Markdown file
 */
export const parseProgressMarkdown = (filePath) => {
  const fileContent = fs.readFileSync(filePath, 'utf-8');
  const { data: frontmatter, content } = matter(fileContent);

  return {
    task_id: frontmatter.task_id,
    agent_id: frontmatter.agent_id,
    message: content.trim(),
    changes_made: frontmatter.changes_made || {},
    files_modified: frontmatter.files_modified || [],
    timestamp: frontmatter.timestamp || new Date().toISOString(),
  };
};

/**
 * Create a progress log entry in Supabase
 */
export const logProgressToSupabase = async (taskId, agentId, message, changesMade = {}, filesModified = []) => {
  try {
    const result = await supabase
      .from('task_progress_log')
      .insert([
        {
          task_id: taskId,
          agent_id: agentId,
          message: message,
          changes_made: changesMade,
          files_modified: filesModified,
        },
      ])
      .select()
      .single();

    if (result.error) {
      throw new Error(`Progress logging failed: ${result.error.message}`);
    }

    console.log(`✓ Progress logged for task ${taskId}`);
    return result.data;
  } catch (error) {
    console.error(`✗ Error logging progress: ${error.message}`);
    throw error;
  }
};

/**
 * Sync progress from Markdown file to Supabase
 */
export const syncProgressFromMarkdown = async (filePath) => {
  try {
    const progressData = parseProgressMarkdown(filePath);

    const result = await logProgressToSupabase(
      progressData.task_id,
      progressData.agent_id,
      progressData.message,
      progressData.changes_made,
      progressData.files_modified
    );

    return result;
  } catch (error) {
    console.error(`✗ Error syncing progress: ${error.message}`);
    throw error;
  }
};
```

### Progress Markdown Format

```markdown
---
task_id: 550e8400-e29b-41d4-a716-446655440000
agent_id: 550e8400-e29b-41d4-a716-446655440001
timestamp: 2024-01-20T15:30:00Z
changes_made:
  added:
    - function createUser
    - database migration v001
  modified:
    - apiEndpoint.ts
files_modified:
  - src/api/users.ts
  - db/migrations/001_create_users.sql
---

## Daily Progress Update - Jan 20

Completed implementation of user creation API endpoint. All unit tests passing.

### Work Done

1. Created user creation endpoint
2. Added input validation
3. Wrote 15 unit tests
4. Updated API documentation

### Blockers

None at this time.

### Next Steps

- Code review approval
- Integration testing
```

---

## Syncing Changes & Changelog

### Create Changelog Entry

Create `changelogSyncHandler.js`:

```javascript
import { supabase } from './supabaseClient.js';

/**
 * Create a changelog entry
 */
export const createChangelogEntry = async (
  agentId,
  taskId,
  changeType,
  description,
  filesAffected = [],
  diffSummary = null,
  forGoogleDocs = true
) => {
  try {
    const result = await supabase
      .from('changelog')
      .insert([
        {
          agent_id: agentId,
          task_id: taskId,
          change_type: changeType, // 'added', 'modified', 'removed', 'fixed'
          description: description,
          files_affected: filesAffected,
          diff_summary: diffSummary,
          for_google_docs: forGoogleDocs,
          synced_to_docs: false,
        },
      ])
      .select()
      .single();

    if (result.error) {
      throw new Error(`Changelog creation failed: ${result.error.message}`);
    }

    console.log(`✓ Changelog entry created: ${changeType}`);
    return result.data;
  } catch (error) {
    console.error(`✗ Error creating changelog: ${error.message}`);
    throw error;
  }
};

/**
 * Batch create changelog entries from a list
 */
export const batchCreateChangelog = async (entries) => {
  try {
    const results = [];

    for (const entry of entries) {
      const result = await createChangelogEntry(
        entry.agent_id,
        entry.task_id,
        entry.change_type,
        entry.description,
        entry.files_affected || [],
        entry.diff_summary,
        entry.for_google_docs !== false
      );
      results.push(result);
    }

    console.log(`✓ Synced ${results.length} changelog entries`);
    return results;
  } catch (error) {
    console.error(`✗ Error batch syncing changelog: ${error.message}`);
    throw error;
  }
};

/**
 * Mark changelog entries as synced to Google Docs
 */
export const markChangelogSyncedToGoogleDocs = async (changelogIds) => {
  try {
    const result = await supabase
      .from('changelog')
      .update({
        synced_to_docs: true,
        synced_at: new Date().toISOString(),
      })
      .in('id', changelogIds)
      .select();

    if (result.error) {
      throw new Error(`Mark synced failed: ${result.error.message}`);
    }

    console.log(`✓ Marked ${result.data.length} entries as synced`);
    return result.data;
  } catch (error) {
    console.error(`✗ Error marking synced: ${error.message}`);
    throw error;
  }
};
```

### Example: Recording a Code Change

```javascript
import { createChangelogEntry } from './changelogSyncHandler.js';

// When a feature is added
await createChangelogEntry(
  agentId,
  taskId,
  'added',
  'Created user authentication module with JWT support',
  ['src/auth/jwt.ts', 'src/auth/strategies.ts'],
  `
  + export function verifyToken(token: string): JWTPayload { ... }
  + export function generateToken(payload: object): string { ... }
  `,
  true // Should sync to Google Docs
);

// When a bug is fixed
await createChangelogEntry(
  agentId,
  taskId,
  'fixed',
  'Fixed race condition in database transaction handling',
  ['src/db/transaction.ts'],
  `
  - const transaction = await db.begin();
  + const transaction = await db.begin({ isolation: 'SERIALIZABLE' });
  `,
  true
);
```

---

## Retrieving Data from Supabase

### Fetch Tasks

Create `dataRetrievalHandler.js`:

```javascript
import { supabase } from './supabaseClient.js';

/**
 * Fetch a single task by ID
 */
export const fetchTask = async (taskId) => {
  try {
    const result = await supabase
      .from('tasks')
      .select('*')
      .eq('id', taskId)
      .single();

    if (result.error) {
      throw new Error(`Fetch failed: ${result.error.message}`);
    }

    return result.data;
  } catch (error) {
    console.error(`✗ Error fetching task: ${error.message}`);
    throw error;
  }
};

/**
 * Fetch all tasks for a specific phase/sprint
 */
export const fetchTasksByPhase = async (phase, status = null) => {
  try {
    let query = supabase
      .from('tasks')
      .select('*')
      .eq('phase', phase)
      .order('priority', { ascending: false })
      .order('deadline', { ascending: true, nullsFirst: false });

    if (status) {
      query = query.eq('status', status);
    }

    const result = await query;

    if (result.error) {
      throw new Error(`Fetch failed: ${result.error.message}`);
    }

    return result.data;
  } catch (error) {
    console.error(`✗ Error fetching tasks: ${error.message}`);
    throw error;
  }
};

/**
 * Fetch active tasks (dashboard view)
 */
export const fetchActiveTasks = async () => {
  try {
    const result = await supabase
      .from('active_tasks_view')
      .select('*');

    if (result.error) {
      throw new Error(`Fetch failed: ${result.error.message}`);
    }

    return result.data;
  } catch (error) {
    console.error(`✗ Error fetching active tasks: ${error.message}`);
    throw error;
  }
};

/**
 * Fetch agent workload (dashboard view)
 */
export const fetchAgentWorkload = async () => {
  try {
    const result = await supabase
      .from('agent_workload_view')
      .select('*')
      .order('performance_score', { ascending: false });

    if (result.error) {
      throw new Error(`Fetch failed: ${result.error.message}`);
    }

    return result.data;
  } catch (error) {
    console.error(`✗ Error fetching workload: ${error.message}`);
    throw error;
  }
};

/**
 * Fetch progress history for a task
 */
export const fetchTaskProgress = async (taskId, limit = 50) => {
  try {
    const result = await supabase
      .from('task_progress_log')
      .select('*')
      .eq('task_id', taskId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (result.error) {
      throw new Error(`Fetch failed: ${result.error.message}`);
    }

    return result.data;
  } catch (error) {
    console.error(`✗ Error fetching progress: ${error.message}`);
    throw error;
  }
};

/**
 * Fetch recent changelog entries
 */
export const fetchRecentChangelog = async (limit = 30, forGoogleDocs = null) => {
  try {
    let query = supabase
      .from('changelog')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (forGoogleDocs !== null) {
      query = query.eq('for_google_docs', forGoogleDocs);
    }

    const result = await query;

    if (result.error) {
      throw new Error(`Fetch failed: ${result.error.message}`);
    }

    return result.data;
  } catch (error) {
    console.error(`✗ Error fetching changelog: ${error.message}`);
    throw error;
  }
};

/**
 * Search memory by key or category
 */
export const searchMemory = async (agentId, searchKey = null, category = null) => {
  try {
    let query = supabase
      .from('memory')
      .select('*');

    if (agentId) {
      query = query.eq('agent_id', agentId);
    }

    if (category) {
      query = query.eq('category', category);
    }

    if (searchKey) {
      query = query.ilike('key', `%${searchKey}%`);
    }

    const result = await query.order('updated_at', { ascending: false });

    if (result.error) {
      throw new Error(`Search failed: ${result.error.message}`);
    }

    return result.data;
  } catch (error) {
    console.error(`✗ Error searching memory: ${error.message}`);
    throw error;
  }
};
```

### Example: Agent Reading Current Tasks

```javascript
import { fetchActiveTasks, fetchTasksByPhase } from './dataRetrievalHandler.js';

// Get all active tasks
const activeTasks = await fetchActiveTasks();

// Get tasks for current phase
const phaseTasksInProgress = await fetchTasksByPhase('Phase 1', 'in_progress');

// Filter by agent
const myTasks = activeTasks.filter(task => task.agent_names?.includes('Agent Alpha'));

console.log('My active tasks:', myTasks);
```

---

## Full Sync Workflow

### Complete Sync Cycle

Create `fullSyncOrchestrator.js`:

```javascript
import fs from 'fs';
import path from 'path';
import {
  syncTaskToSupabase,
  parseTaskMarkdown,
  syncAllTasksFromDirectory,
} from './taskSyncHandler.js';
import {
  logProgressToSupabase,
  syncProgressFromMarkdown,
} from './progressSyncHandler.js';
import {
  batchCreateChangelog,
  markChangelogSyncedToGoogleDocs,
} from './changelogSyncHandler.js';
import {
  fetchActiveTasks,
  fetchTaskProgress,
  fetchRecentChangelog,
} from './dataRetrievalHandler.js';
import { supabase } from './supabaseClient.js';

/**
 * Full sync orchestrator - coordinates all sync operations
 */
export class SyncOrchestrator {
  constructor(agentId, projectRoot) {
    this.agentId = agentId;
    this.projectRoot = projectRoot;
    this.tasksDir = path.join(projectRoot, 'tasks');
    this.progressDir = path.join(projectRoot, 'progress');
    this.changelogDir = path.join(projectRoot, 'changelog');
    this.docsDir = path.join(projectRoot, 'docs');
  }

  /**
   * Sync all local changes to Supabase
   */
  async pushLocalChanges() {
    console.log('📤 Pushing local changes to Supabase...');

    try {
      // Sync tasks
      console.log('  Syncing tasks...');
      const taskResults = await syncAllTasksFromDirectory(this.tasksDir, this.agentId);
      const successfulTasks = taskResults.filter(r => r.status === 'success').length;
      console.log(`  ✓ Synced ${successfulTasks}/${taskResults.length} tasks`);

      // Sync progress updates
      console.log('  Syncing progress updates...');
      const progressFiles = fs.readdirSync(this.progressDir).filter(f => f.endsWith('.md'));
      const progressResults = [];
      for (const file of progressFiles) {
        try {
          const result = await syncProgressFromMarkdown(path.join(this.progressDir, file));
          progressResults.push(result);
        } catch (error) {
          console.warn(`    ⚠ Failed to sync ${file}: ${error.message}`);
        }
      }
      console.log(`  ✓ Synced ${progressResults.length} progress updates`);

      return {
        tasks: taskResults,
        progress: progressResults,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      console.error('✗ Error during push:', error.message);
      throw error;
    }
  }

  /**
   * Sync all data from Supabase to local Markdown files
   */
  async pullRemoteData() {
    console.log('📥 Pulling data from Supabase...');

    try {
      // Fetch active tasks
      const activeTasks = await fetchActiveTasks();
      console.log(`  ✓ Fetched ${activeTasks.length} active tasks`);

      // Save tasks to local files
      for (const task of activeTasks) {
        const filePath = path.join(this.tasksDir, `${task.id}.md`);
        const markdown = this._taskToMarkdown(task);
        fs.writeFileSync(filePath, markdown);
      }

      // Fetch recent changelog
      const changelog = await fetchRecentChangelog(20);
      const changelogPath = path.join(this.changelogDir, 'recent.md');
      const changelogMarkdown = this._changelogToMarkdown(changelog);
      fs.writeFileSync(changelogPath, changelogMarkdown);

      return {
        tasks: activeTasks.length,
        changelog: changelog.length,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      console.error('✗ Error during pull:', error.message);
      throw error;
    }
  }

  /**
   * Full bidirectional sync
   */
  async syncBidirectional() {
    console.log('🔄 Starting bidirectional sync...\n');

    const pushResult = await this.pushLocalChanges();
    console.log('');
    const pullResult = await this.pullRemoteData();

    console.log('\n✓ Bidirectional sync complete!');
    return {
      pushed: pushResult,
      pulled: pullResult,
    };
  }

  /**
   * Convert task object to Markdown
   */
  _taskToMarkdown(task) {
    const frontmatter = `---
id: ${task.id}
type: task
title: "${task.title}"
status: ${task.status}
priority: ${task.priority}
phase: ${task.phase || 'N/A'}
sprint: ${task.sprint || 'N/A'}
estimated_hours: ${task.estimated_hours || 'TBD'}
deadline: ${task.deadline || 'N/A'}
sync_timestamp: ${new Date().toISOString()}
---

`;

    const acceptanceCriteria = task.acceptance_criteria
      ?.map(c => `- [${c.completed ? 'x' : ' '}] ${c.criteria}`)
      .join('\n') || '';

    return frontmatter + task.description + '\n\n## Acceptance Criteria\n\n' + acceptanceCriteria;
  }

  /**
   * Convert changelog array to Markdown
   */
  _changelogToMarkdown(entries) {
    let markdown = `# Recent Changelog\n\nGenerated: ${new Date().toISOString()}\n\n`;

    for (const entry of entries) {
      markdown += `## ${entry.change_type.toUpperCase()}: ${entry.description}\n`;
      markdown += `**By:** ${entry.agent_id}\n`;
      markdown += `**Date:** ${entry.created_at}\n`;
      if (entry.files_affected?.length) {
        markdown += `**Files:** ${entry.files_affected.join(', ')}\n`;
      }
      markdown += `\n`;
    }

    return markdown;
  }
}

// Usage
const orchestrator = new SyncOrchestrator('agent-uuid', './project');
await orchestrator.syncBidirectional();
```

---

## Best Practices

### 1. Regular Sync Intervals

Establish a regular sync schedule:

```javascript
// Sync every 30 minutes
setInterval(async () => {
  try {
    await orchestrator.syncBidirectional();
  } catch (error) {
    console.error('Sync failed:', error);
    // Log to monitoring system
  }
}, 30 * 60 * 1000);
```

### 2. Use Unique Task IDs

Always generate UUIDs for new tasks to avoid conflicts:

```javascript
import { v4 as uuidv4 } from 'uuid';

const newTaskId = uuidv4();
```

### 3. Validate Before Syncing

Validate Markdown files before uploading:

```javascript
const validateTask = (taskData) => {
  if (!taskData.title) throw new Error('Title required');
  if (!['critical', 'high', 'medium', 'low'].includes(taskData.priority)) {
    throw new Error('Invalid priority');
  }
  return true;
};
```

### 4. Handle Conflicts

If the same task is modified locally and remotely:

```javascript
const resolveConflict = (local, remote) => {
  // Use the most recently updated version
  return new Date(local.updated_at) > new Date(remote.updated_at) ? local : remote;
};
```

### 5. Log All Sync Operations

Maintain a sync log for audit trails:

```javascript
const logSyncOperation = async (operation, status, details) => {
  const logEntry = {
    timestamp: new Date().toISOString(),
    operation,
    status,
    details,
  };

  fs.appendFileSync('.sync-log.json', JSON.stringify(logEntry) + '\n');
};
```

### 6. Use Transactions for Related Updates

When syncing multiple related records:

```javascript
const syncTaskWithAssignments = async (task, assignments) => {
  try {
    // Insert task
    const taskResult = await supabase
      .from('tasks')
      .insert([task])
      .select()
      .single();

    // Insert assignments for this task
    const assignmentPromises = assignments.map(a =>
      supabase
        .from('task_assignments')
        .insert([{ ...a, task_id: taskResult.data.id }])
    );

    await Promise.all(assignmentPromises);
  } catch (error) {
    console.error('Sync failed:', error);
    // Rollback or manual recovery needed
  }
};
```

---

## Troubleshooting

### Issue: "Auth Error: Invalid token"

**Solution:** Ensure your Supabase key is correctly set:

```bash
export SUPABASE_URL="https://your-project.supabase.co"
export SUPABASE_ANON_KEY="your-anon-key"
```

### Issue: "Unique constraint violation" on task sync

**Solution:** Check for duplicate task IDs. Use UUID generation:

```javascript
const { v4: uuidv4 } = require('uuid');
taskData.id = taskData.id || uuidv4();
```

### Issue: Large files timing out during sync

**Solution:** Batch sync large operations:

```javascript
const batchSync = async (items, batchSize = 10) => {
  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    await Promise.all(batch.map(item => syncTaskToSupabase(item)));
  }
};
```

### Issue: Files Modified timestamps not updating

**Solution:** Ensure the trigger is active:

```sql
-- Check if trigger exists
SELECT * FROM pg_trigger WHERE tgname = 'tasks_updated_at';

-- If missing, recreate:
CREATE TRIGGER tasks_updated_at BEFORE UPDATE ON tasks
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

### Issue: Real-time sync not working

**Solution:** Ensure you're subscribed to changes:

```javascript
const channel = supabase
  .channel('tasks')
  .on(
    'postgres_changes',
    { event: '*', schema: 'public', table: 'tasks' },
    (payload) => {
      console.log('Task changed:', payload);
      // Handle update
    }
  )
  .subscribe();
```

---

## Advanced: Real-Time Collaboration

Watch for changes from other agents in real-time:

```javascript
/**
 * Subscribe to real-time task updates
 */
export const subscribeToTaskUpdates = (taskId, callback) => {
  return supabase
    .channel(`task-${taskId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'task_progress_log',
        filter: `task_id=eq.${taskId}`,
      },
      (payload) => {
        callback(payload);
      }
    )
    .subscribe();
};

// Usage: Real-time progress tracking
subscribeToTaskUpdates(taskId, (payload) => {
  console.log('New update from agent:', payload.new.message);
  // Update local UI
});
```

---

## Conclusion

This sync guide enables seamless bidirectional synchronization between agent local files and the Supabase database, supporting:

- **Offline work** with local Markdown files
- **Real-time collaboration** between agents
- **Audit trails** via changelog
- **Conflict resolution** via timestamps
- **Dashboard monitoring** via views

For additional help, refer to [Supabase JavaScript Documentation](https://supabase.com/docs/reference/javascript).
