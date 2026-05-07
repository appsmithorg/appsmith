# Temporal Removal Analysis: Appsmith Workflow Feature

## Executive Summary

This document provides a thorough analysis of what it takes to remove Temporal from the Appsmith workflow feature and replace it with a lighter-weight alternative. The goal is to make the tech stack leaner (eliminating Temporal server, its Postgres dependency, and associated Docker image vulnerabilities) **without** compromising any existing workflow behavior or features.

**Key findings:**

1. Temporal is used exclusively in the **Enterprise Edition (EE)** codebase — the CE repo contains only the abstraction seams and stubs
2. Temporal runs as a **Node.js worker** inside the RTS process (not in the Java server)
3. Temporal requires a dedicated **Temporal Server** process + **PostgreSQL** database for persistence
4. The workflow feature surface is well-defined: trigger, execute, pause/resume (HITL), schedule, run history
5. Replacement is feasible with a custom-built, MongoDB-backed workflow engine embedded in the RTS and/or Java server

---

## Table of Contents

1. [Current Architecture](#1-current-architecture)
2. [What Temporal Provides Today](#2-what-temporal-provides-today)
3. [Pain Points with Temporal](#3-pain-points-with-temporal)
4. [Workflow Feature Surface to Preserve](#4-workflow-feature-surface-to-preserve)
5. [Replacement Strategy Options](#5-replacement-strategy-options)
6. [Recommended Approach: Custom MongoDB-Backed Workflow Engine](#6-recommended-approach-custom-mongodb-backed-workflow-engine)
7. [Migration Plan](#7-migration-plan)
8. [Risk Assessment](#8-risk-assessment)
9. [Appendix: Files Impacted](#9-appendix-files-impacted)

---

## 1. Current Architecture

### How Temporal Fits in the Stack

```
 ┌───────────────────────────────────────────────────────┐
 │                    Docker Container                    │
 │                                                       │
 │  ┌──────────┐  ┌──────────┐  ┌───────────────────┐   │
 │  │  Caddy   │  │  Editor  │  │    Java Server    │   │
 │  │ (proxy)  │  │ (static) │  │   (Spring Boot)   │   │
 │  └──────────┘  └──────────┘  └─────────┬─────────┘   │
 │                                        │              │
 │  ┌──────────────────────────┐          │              │
 │  │       RTS (Node.js)      │          │              │
 │  │  ┌────────────────────┐  │    ┌─────┴─────┐       │
 │  │  │  Temporal Worker   │  │    │  MongoDB  │       │
 │  │  │  (@temporalio/     │  │    │  (primary │       │
 │  │  │   worker)          │  │    │   store)  │       │
 │  │  └────────┬───────────┘  │    └───────────┘       │
 │  └───────────┼──────────────┘                         │
 │              │                                        │
 │  ┌───────────┴──────────────┐  ┌───────────────────┐  │
 │  │    Temporal Server       │  │    PostgreSQL     │  │
 │  │    (Go binary)           │──│  (Temporal +      │  │
 │  │                          │  │   Keycloak data)  │  │
 │  └──────────────────────────┘  └───────────────────┘  │
 │                                                       │
 │  ┌──────────┐                                         │
 │  │  Redis   │                                         │
 │  └──────────┘                                         │
 └───────────────────────────────────────────────────────┘
```

### Component Breakdown

| Component | Location | Purpose |
|-----------|----------|---------|
| **Temporal Worker** | RTS (Node.js) — EE code in `app/client/packages/rts/src/ee/` | Executes workflow activities (query execution, JS object execution, HITL signal handling) |
| **Temporal Server** | Separate Go binary process (EE Docker image) | Orchestrates workflow execution: scheduling, retries, durable state, signal handling |
| **Temporal SDK** | `@temporalio/worker`, `@temporalio/client` npm packages | Node.js SDK for defining workflows, activities, and connecting to Temporal Server |
| **PostgreSQL** | Embedded or external | Stores Temporal's workflow history, visibility data, and Keycloak data |
| **Java Server** | `app/server/` | Exposes workflow CRUD APIs, manages workflow metadata in MongoDB, delegates execution to RTS/Temporal |
| **MongoDB** | Primary data store | Stores workflow definitions, action configs, JS collections, and application metadata |

### Key Technical Details (from EE Error Logs and Issue Trackers)

- **Task Queue**: `appsmith-queue`
- **Namespace**: `default`
- **Workflow Type**: `executeWorkflow`
- **Activity Type**: `executeActivity`
- **gRPC Port**: Temporal server listens on port `7233` (standard)
- **Worker Location**: `/opt/appsmith/rts/bundle/server.js` (bundled RTS)

### CE vs EE Code Split

The CE (open-source) codebase contains:
- **Artifact framework**: `ArtifactType.WORKFLOW` enum, `CreatorContextType.WORKFLOW`, but all `switch` statements fall through to `APPLICATION` handling
- **Client stubs**: All workflow selectors return empty arrays/`false` (e.g., `getWorkflowsList → []`, `getShowWorkflowFeature → false`)
- **UI placeholder components**: `WorkflowCardList`, `WorkflowSearchItem`, `RunHistoryTrigger`, `RunHistoryTab` — all return `null`
- **Plumbing fields**: `workflowId` on `Action`, `JSCollection`, `ChangeQueryPayload`
- **Plugin type**: `PluginType.INTERNAL` / `PluginPackageName.WORKFLOW = "workflow-plugin"`
- **RTS build hooks**: `externalWorkflowPackages = []` in `build.js` (empty in CE, populated in EE)

The EE codebase (not accessible here) contains:
- **Temporal Worker** registration and activity implementations
- **Workflow definitions** (the `executeWorkflow` Temporal workflow)
- **Workflow proxy routes** in RTS (`workflowProxy/`)
- **Workflow domain model** (`Workflow` entity in MongoDB)
- **Workflow service/controller** (CRUD, trigger, get/resolve requests)
- **Workflow JSON** for import/export
- **Run history** implementation
- **Scheduled trigger** (cron) implementation
- **Webhook trigger** handling
- **Temporal server** startup configuration

---

## 2. What Temporal Provides Today

Temporal is being used for **exactly five capabilities** in the Appsmith workflow feature:

### 2.1 Durable Workflow Execution
- A user-defined JS function (`executeWorkflow`) runs as a Temporal workflow
- Each workflow run gets a unique `workflowRunId`
- If the RTS process crashes mid-execution, Temporal replays the workflow from its event history
- Activities (query execution, JS object calls) are individually recorded and can be retried

### 2.2 Human-in-the-Loop (HITL) / Pause-Resume
- `assignRequest()` creates a pending request and **pauses the workflow** using Temporal signals
- The workflow suspends indefinitely (minutes, hours, days) waiting for a human to approve/reject
- When a user resolves the request via a "Resolve Requests" workflow query, a Temporal signal resumes the workflow
- The resolution data is returned to the workflow code that called `assignRequest()`
- This is the **most critical Temporal feature** — it requires durable, crash-safe long-running state

### 2.3 Activity Execution with Retry/Timeout
- Each query or JS object call within a workflow runs as a Temporal "activity"
- Activities have configurable timeouts and retry policies
- Failed activities are retried according to the retry policy
- Activity results are durably recorded in Temporal's event history

### 2.4 Scheduled Triggers (Cron)
- Workflows can be triggered on a cron schedule (e.g., every 5 minutes, daily at noon)
- Temporal's built-in cron schedule feature handles this
- The schedule is timezone-aware

### 2.5 Run History / Observability
- Every workflow execution and its activities are recorded in Temporal's event history
- The Run History UI in Appsmith reads this history to show:
  - Timestamps for each activity start/end
  - Activity parameters and results
  - Error details for failed activities
  - Overall workflow status (success/failure)

---

## 3. Pain Points with Temporal

### 3.1 Infrastructure Overhead
- **Temporal Server**: A separate Go binary that must run as its own process (4+ GB RAM recommended)
- **PostgreSQL**: Required for Temporal's persistence (workflow history + visibility store)
  - This is a **second database** in addition to MongoDB
  - Postgres is also shared with Keycloak (SSO), creating coupling
- **4-6 additional containers** minimum in a Kubernetes deployment
- **gRPC**: Temporal uses gRPC for communication between client/worker and server

### 3.2 Docker Image Vulnerabilities
- Temporal Server Docker images ship with Go runtime + base OS dependencies
- Multiple CVEs reported (CVE-2025-61729, CVE-2026-33186, etc.) — some CRITICAL
- The `@temporalio/worker` npm package pulls in `@grpc/grpc-js` and native Rust-compiled core SDK
- Each vulnerability in the Temporal supply chain becomes a vulnerability in the Appsmith image

### 3.3 Operational Complexity
- Users must configure PostgreSQL (v13-v16) for workflows to function
- ECS/custom deployments frequently break because Temporal's Postgres dependency isn't well-documented
- Temporal was **disabled by default** on startup (PR #33157) due to startup/stability concerns
- Debugging workflow issues requires understanding Temporal internals (task tokens, event history, replay semantics)

### 3.4 Developer Experience
- Temporal's "replay" semantics impose **determinism constraints** on workflow code
- The Temporal TypeScript SDK requires a custom V8 isolate for workflow code (separate from Node.js)
- Testing workflow logic requires a Temporal test environment
- The learning curve for Temporal concepts is steep for new contributors

---

## 4. Workflow Feature Surface to Preserve

Any replacement **must** support all of the following without regression:

| Feature | Description | Complexity |
|---------|-------------|------------|
| **Webhook Trigger** | HTTP POST to a unique URL triggers workflow execution | Low |
| **Scheduled Trigger** | Cron-based execution at specified intervals/times with timezone support | Medium |
| **Trigger from App** | Workflow query with "Trigger Workflow" request type | Low |
| **executeWorkflow()** | Entry point function that receives JSON data parameter | Low |
| **Query Execution** | Run datasource queries (API, DB, etc.) within workflow | Medium |
| **JS Object Execution** | Run JS functions within workflow | Medium |
| **assignRequest() / HITL** | Pause workflow, create pending request, wait for human resolution, resume with resolution data | **High** |
| **Get Requests** | Retrieve pending requests for the logged-in user | Medium |
| **Resolve Requests** | Resolve a pending request and resume the paused workflow | **High** |
| **Response Handling** | `appsmith.workflows.response()` to return HTTP response to webhook caller | Low |
| **Run History** | Track all workflow runs with per-activity timestamps, parameters, errors | Medium |
| **Retry on Failure** | Automatic retry of failed activities with configurable policy | Medium |
| **Crash Recovery** | Resume workflow execution after process restart | **High** |
| **Concurrent Execution** | Multiple workflow instances running simultaneously | Medium |
| **Workflow CRUD** | Create, read, update, delete workflows (metadata in MongoDB) | Low (already exists) |
| **Git Integration** | Export/import workflows, version control | Low (artifact framework exists) |
| **Publish/Deploy** | Published vs unpublished workflow versions | Medium |

---

## 5. Replacement Strategy Options

### Option A: Custom MongoDB-Backed Workflow Engine (Recommended)

**Concept**: Build a lightweight workflow execution engine that uses MongoDB (already the primary data store) for workflow state persistence. Run it embedded in the RTS or Java server process.

**Pros**:
- Eliminates Temporal Server, Postgres dependency, and all Temporal SDK packages
- Uses existing MongoDB infrastructure (no new database)
- Full control over the execution model, debugging, and observability
- Drastically reduces Docker image size and vulnerability surface
- Simpler deployment: no additional processes, no gRPC

**Cons**:
- Requires implementing durable execution primitives (state machine, checkpointing)
- HITL pause/resume must be built from scratch
- Must ensure crash recovery is reliable
- Non-trivial engineering effort

**Estimated scope**: Touches RTS (primary), Java server (APIs), and client (minimal — stubs already exist)

---

### Option B: Embedded Lightweight Workflow Library

**Candidates**: Flowable (Java, BPMN), Bull/BullMQ (Node.js, Redis-based), Agenda (Node.js, MongoDB-based)

**Pros**:
- Less code to write than fully custom
- Some libraries have MongoDB or Redis persistence (no new dependencies)

**Cons**:
- **Flowable/jBPM**: Java-based, BPMN-oriented — architectural mismatch (workflows are JS-based, run in RTS/Node.js)
- **Bull/BullMQ**: Redis-based job queue — good for task execution but no native HITL/signal support; Redis is volatile storage
- **Agenda/agenda4j**: MongoDB-based scheduler — good for cron, but no workflow state machine or HITL
- None of these provide the full feature set needed; you'd still need to build the HITL layer, run history, etc.
- Introduces a new dependency (contradicts "lean stack" goal)

**Verdict**: Partial fit at best. You'd end up wrapping a library with so much custom code that you might as well build the engine directly.

---

### Option C: Move Workflow Execution to Java Server (Spring State Machine + MongoDB)

**Concept**: Instead of running workflows in Node.js/RTS, move the execution engine to the Java server using Spring State Machine or a custom state machine backed by MongoDB.

**Pros**:
- Consolidates workflow execution into the main server process
- Spring ecosystem has state machine libraries
- MongoDB is already wired up in the Java server
- Could simplify the RTS (one fewer responsibility)

**Cons**:
- **Major architectural shift**: Workflows currently execute JS code (user-defined `executeWorkflow` functions) — running JS in the JVM requires a JS engine (GraalJS, Nashorn)
- Query execution within workflows would need to call back into the Java server's action execution pipeline
- The RTS currently handles the JS execution context, binding `appsmith.workflows.*` functions
- This is the most invasive option and risks introducing new bugs

**Verdict**: Architecturally cleaner long-term, but the JS execution requirement makes this a much larger project.

---

### Option D: DBOS or Durable Execution Library

**Concept**: Use a "durable execution" library like DBOS that provides Temporal-like semantics without a separate server.

**Pros**:
- Closest semantic match to Temporal (durable execution, automatic replay)
- No separate server process

**Cons**:
- DBOS requires PostgreSQL (doesn't solve the Postgres dependency problem)
- Relatively new, lower adoption
- TypeScript version may not be mature enough for production

**Verdict**: Doesn't solve the core problem (Postgres dependency).

---

## 6. Recommended Approach: Custom MongoDB-Backed Workflow Engine

### Architecture Overview

```
 ┌───────────────────────────────────────────────────────┐
 │                    Docker Container                    │
 │                                                       │
 │  ┌──────────┐  ┌──────────┐  ┌───────────────────┐   │
 │  │  Caddy   │  │  Editor  │  │    Java Server    │   │
 │  │ (proxy)  │  │ (static) │  │   (Spring Boot)   │   │
 │  └──────────┘  └──────────┘  └─────────┬─────────┘   │
 │                                        │              │
 │  ┌──────────────────────────┐          │              │
 │  │       RTS (Node.js)      │          │              │
 │  │  ┌────────────────────┐  │    ┌─────┴─────┐       │
 │  │  │  Workflow Engine   │  │    │  MongoDB  │       │
 │  │  │  (custom, in-     │──┼───▶│  (primary │       │
 │  │  │   process)         │  │    │   store)  │       │
 │  │  └────────────────────┘  │    └───────────┘       │
 │  └──────────────────────────┘                         │
 │                                                       │
 │  ┌──────────┐                                         │
 │  │  Redis   │  (session cache only, no workflow data) │
 │  └──────────┘                                         │
 └───────────────────────────────────────────────────────┘

 ❌ No Temporal Server
 ❌ No PostgreSQL (unless Keycloak SSO is used)
```

### Core Components to Build

#### 6.1 Workflow State Machine

A document-based state machine stored in MongoDB. Each workflow run is a document:

```javascript
// Collection: workflowRuns
{
  _id: ObjectId,
  workflowId: "workflow-123",         // Reference to workflow definition
  workflowRunId: "XMXWTMOS",          // Human-readable short ID
  status: "RUNNING",                   // PENDING | RUNNING | PAUSED | COMPLETED | FAILED
  triggerType: "WEBHOOK",              // WEBHOOK | SCHEDULED | APP
  triggerData: { email: "..." },       // Input data
  currentStep: 3,                      // Current execution position
  steps: [                             // Execution log (replaces Temporal event history)
    {
      stepIndex: 0,
      type: "ACTIVITY",                // ACTIVITY | HITL_REQUEST | JS_EXECUTION
      name: "qs_send_email",
      status: "COMPLETED",
      startedAt: ISODate,
      completedAt: ISODate,
      input: { email: "..." },
      output: { statusCode: 200 },
      attempt: 1,
      error: null
    },
    {
      stepIndex: 1,
      type: "HITL_REQUEST",
      name: "Approval",
      status: "PENDING",               // PENDING | RESOLVED
      startedAt: ISODate,
      requestId: ObjectId,
      resolutions: ["Approve", "Reject"],
      assignedUsers: ["user@email.com"],
      resolution: null,                // Filled when resolved
      resolvedBy: null,
      resolvedAt: null
    }
  ],
  webhookResponseSent: false,
  webhookResponse: null,
  createdAt: ISODate,
  updatedAt: ISODate,
  completedAt: null,
  error: null,
  retryPolicy: {
    maxAttempts: 3,
    backoffMultiplier: 2,
    initialIntervalMs: 1000
  }
}
```

#### 6.2 Execution Engine

The execution engine replaces the Temporal worker:

```
Trigger (webhook/schedule/app)
  │
  ▼
Create workflowRun document (status: RUNNING)
  │
  ▼
Load workflow JS code (Main JS Object)
  │
  ▼
Execute executeWorkflow(data) in sandboxed context
  │
  ├── Query/JS calls → execute as "activity", record in steps[]
  │     └── On failure → retry per policy, record attempts
  │
  ├── assignRequest() call → 
  │     ├── Create HITL request document
  │     ├── Update workflowRun status to PAUSED
  │     ├── Persist execution checkpoint (current step, local state)
  │     └── Return (workflow suspends)
  │
  └── Completion → update status to COMPLETED/FAILED
```

**Key design decisions:**

- **Checkpoint-based, not replay-based**: Unlike Temporal which replays the entire workflow from event history, we checkpoint the execution state at suspension points (HITL requests). This is simpler and avoids Temporal's determinism constraints.
- **MongoDB transactions**: Use MongoDB transactions to atomically update workflow state, ensuring consistency.
- **In-process execution**: The workflow engine runs inside the RTS Node.js process, no IPC/gRPC needed.

#### 6.3 HITL (Pause/Resume) Implementation

This is the most critical piece to get right:

```
assignRequest() called in workflow code
  │
  ▼
1. Serialize execution checkpoint:
   - workflowRunId
   - Current step index
   - Local variable state (serialized continuation)
   - Remaining workflow code path
  │
  ▼
2. Create workflowRequest document in MongoDB:
   {
     _id: ObjectId,
     workflowRunId: "XMXWTMOS",
     workflowId: "workflow-123",
     requestName: "Approval",
     status: "PENDING",
     resolutions: ["Approve", "Reject"],
     assignedUsers: ["user@email.com"],
     assignedGroups: [],
     message: "Refund request...",
     metadata: { orderId: 456 },
     createdAt: ISODate
   }
  │
  ▼
3. Update workflowRun: status → PAUSED, save checkpoint
  │
  ▼
4. Workflow function returns (Node.js event loop is free)

  ... time passes (minutes/hours/days) ...

Resolve Request API called
  │
  ▼
5. Update workflowRequest: status → RESOLVED, resolution, resolvedBy
  │
  ▼
6. Load checkpoint from workflowRun document
  │
  ▼
7. Resume workflow execution from checkpoint:
   - Restore execution context
   - Return resolution data to the assignRequest() call
   - Continue executing remaining workflow code
  │
  ▼
8. Continue to completion or next HITL point
```

**Implementation approach for checkpoint/resume:**

The most practical approach is to use **JavaScript async/await with a promise-based suspension mechanism**:

1. When `assignRequest()` is called, it returns a Promise
2. The Promise's resolver is stored in a Map keyed by `workflowRunId`
3. The workflow run state is persisted to MongoDB
4. When the resolve API is called, the stored Promise resolver is invoked with the resolution data
5. If the RTS process restarts before resolution, the workflow run is rehydrated from MongoDB on startup

For **crash recovery**, on RTS startup:
- Query MongoDB for all `PAUSED` workflow runs
- For each, re-register the Promise resolver so that when the resolve API is called, it can resume
- For `RUNNING` workflows that were interrupted, either retry from the last completed step or mark as failed

#### 6.4 Cron Scheduler

Replace Temporal's cron workflow with a simple in-process scheduler:

- Use `node-cron` or a similar lightweight library (already widely used, minimal footprint)
- On RTS startup, load all workflows with scheduled triggers from MongoDB
- Register cron jobs that trigger workflow execution
- Persist schedule state in MongoDB (last run time, next scheduled time)
- Use MongoDB distributed locks to prevent duplicate execution in multi-instance deployments

#### 6.5 Run History

Replace Temporal's event history with the `steps[]` array in the workflow run document:

- Each activity/step is recorded with timestamps, inputs, outputs, errors
- The Run History UI reads from a new API endpoint that queries `workflowRuns` collection
- Filtering by "All Runs" and "Failed Runs" is a simple MongoDB query on `status`

#### 6.6 Webhook Handler

This is relatively straightforward:
- Register an Express route in RTS for webhook URLs
- Validate the API key embedded in the URL
- Create a workflow run and start execution
- If `appsmith.workflows.response()` is called, send the HTTP response back

### What Gets Removed

| Component | Current | After |
|-----------|---------|-------|
| **Temporal Server** (Go binary) | Runs as supervised process | **Removed** |
| **`@temporalio/worker`** npm package | Bundled in RTS | **Removed** |
| **`@temporalio/client`** npm package | Used in RTS | **Removed** |
| **`@temporalio/workflow`** npm package | Used in RTS | **Removed** |
| **`@temporalio/activity`** npm package | Used in RTS | **Removed** |
| **gRPC dependency** (`@grpc/grpc-js`) | Required by Temporal SDK | **Removed** |
| **Rust core SDK** | Native binary in `@temporalio/core-bridge` | **Removed** |
| **PostgreSQL** (for Temporal) | Stores workflow history | **Removed** (unless Keycloak needs it) |
| **Supervisord Temporal config** | Starts Temporal server | **Removed** |

### What Gets Added

| Component | Description |
|-----------|-------------|
| **Workflow Engine module** in RTS | ~2000-3000 lines of TypeScript |
| **MongoDB collections** | `workflowRuns`, `workflowRequests`, `workflowSchedules` |
| **`node-cron`** (or similar) | Lightweight cron scheduler (~50KB) |
| **Workflow API endpoints** in RTS | Trigger, resolve, history endpoints |

---

## 7. Migration Plan

### Phase 1: Build the Engine (Parallel Development)

Build the custom workflow engine as a new module in the RTS EE codebase, alongside the existing Temporal-based implementation. Use a feature flag to switch between them.

**Tasks:**
1. Design MongoDB schema for `workflowRuns`, `workflowRequests`, `workflowSchedules`
2. Implement the workflow execution engine (activity execution, step recording)
3. Implement HITL checkpoint/resume mechanism
4. Implement cron scheduler
5. Implement run history API
6. Implement webhook handler
7. Implement crash recovery (startup rehydration)
8. Write comprehensive tests (unit + integration)

### Phase 2: Parity Testing

Run both engines side-by-side and validate behavioral parity:

**Tests to run:**
- Trigger workflow via webhook → verify execution and response
- Trigger workflow via app (workflow query) → verify execution
- Trigger workflow via cron schedule → verify timing accuracy
- HITL flow: trigger → assignRequest → pause → resolve → resume → complete
- Multiple concurrent workflow runs
- Workflow with multiple queries and JS objects
- Error handling: failing query → retry → eventual success/failure
- Crash recovery: kill RTS mid-execution → restart → verify state
- Run history: verify all activities are recorded with correct timestamps

### Phase 3: Migration

1. **Data migration**: Export existing Temporal workflow history and convert to MongoDB format
   - Note: Active HITL workflows (paused, waiting for resolution) need special handling
   - Option: Complete or fail in-flight workflows before migration
2. **Switch feature flag**: Route all new workflow executions through the new engine
3. **Remove Temporal code**: Delete Temporal worker, client, workflow definitions
4. **Remove Temporal packages**: Uninstall all `@temporalio/*` npm packages
5. **Remove Temporal Server**: Remove from Docker image, supervisord config
6. **Remove Postgres** (if only used for Temporal): Remove from Docker image or make optional for Keycloak only

### Phase 4: Cleanup

1. Update deployment documentation
2. Update Docker image to remove Postgres packages (if applicable)
3. Update Helm charts to remove Temporal-related resources
4. Update health checks to remove Temporal process checks
5. Run security scan to verify CVE reduction

---

## 8. Risk Assessment

### High Risk

| Risk | Impact | Mitigation |
|------|--------|------------|
| **HITL checkpoint/resume correctness** | Workflow may not resume correctly after process restart | Extensive testing with crash scenarios; persist enough state to reconstruct execution context |
| **Data loss during migration** | In-flight workflows could be lost | Drain active workflows before migration; provide a "complete all pending" command |
| **Concurrent execution bugs** | Race conditions in MongoDB state updates | Use MongoDB transactions and optimistic locking; distributed locks for multi-instance |

### Medium Risk

| Risk | Impact | Mitigation |
|------|--------|------------|
| **Cron accuracy** | Scheduled workflows may drift or miss runs | Use `node-cron` with MongoDB-backed "last run" tracking; catch-up mechanism for missed runs |
| **Performance at scale** | MongoDB queries for run history could be slow with many runs | Add appropriate indexes; implement pagination; TTL index for old runs |
| **JS execution sandbox** | Security of running user-defined workflow code | Reuse existing RTS sandboxing approach; no regression from current behavior |

### Low Risk

| Risk | Impact | Mitigation |
|------|--------|------------|
| **Webhook compatibility** | External integrations break | Keep the same URL format and API contract |
| **Client UI changes** | Run history UI breaks | The client UI already uses abstract APIs; just change the backend data source |
| **Git/import-export** | Workflow artifacts break | Artifact framework is already abstracted; no Temporal-specific data in exports |

---

## 9. Appendix: Files Impacted

### EE Codebase (Primary Changes)

These files are in the private EE repository and will need the most changes:

| Area | Files (Expected) | Change Type |
|------|-------------------|-------------|
| **RTS Workflow Worker** | `rts/src/ee/workflowProxy/` or similar | **Replace** Temporal worker with custom engine |
| **RTS Server Setup** | `rts/src/ee/server.ts` | Remove Temporal worker registration, add new engine initialization |
| **RTS Build** | `rts/build.js` | Remove `externalWorkflowPackages` entries |
| **RTS package.json** | `rts/package.json` | Remove `@temporalio/*` dependencies |
| **Workflow Service** (Java) | `app/server/.../ee/...WorkflowService*.java` | Update API endpoints to work with new engine |
| **Docker/Supervisord** | `deploy/docker/fs/...` (EE overlays) | Remove Temporal process config |
| **Helm Charts** | `deploy/helm/` (EE overlays) | Remove Temporal pod/service definitions |

### CE Codebase (Minimal Changes)

| File | Change |
|------|--------|
| `deploy/docker/base.dockerfile` | Potentially remove `postgresql-14` if only used for Temporal (verify Keycloak dependency first) |
| `deploy/docker/fs/opt/appsmith/entrypoint.sh` | Remove Temporal-related startup logic (if any in EE overlay) |
| `deploy/docker/fs/opt/appsmith/healthcheck.sh` | Remove Temporal health check (if any in EE overlay) |
| `.cursor/rules/index.mdc` | Update architecture diagram to remove Temporal |
| `.cursor/rules/infra.mdc` | Remove "workflow proxying (Temporal)" reference |

### Client Code (No Changes Expected)

The client code uses abstract selectors and API calls. The workflow UI components (`RunHistoryTrigger`, `RunHistoryTab`, `WorkflowCardList`, etc.) communicate through Redux and API endpoints. Since we're preserving the same API contract, **no client code changes should be necessary**.

---

## Summary: What It Takes

| Dimension | Assessment |
|-----------|------------|
| **Feasibility** | High — the workflow feature surface is well-defined and bounded |
| **Complexity** | Medium-High — HITL checkpoint/resume is the hard part |
| **Scope** | Primarily RTS (Node.js EE code) + deployment configs |
| **Risk** | Manageable with proper testing and phased rollout |
| **Benefit** | Eliminates Temporal Server, Postgres dependency, ~6 npm packages, Go binary, and associated CVEs |
| **Breaking changes** | None for end users if API contracts are preserved |

The bottom line: Temporal is being used for a narrow set of capabilities (durable execution, HITL pause/resume, cron scheduling, activity tracking). These can all be implemented with a custom MongoDB-backed state machine that runs in-process. The hardest part is the HITL checkpoint/resume mechanism, which requires careful design of the serialization and crash recovery logic. Everything else (webhook triggers, cron, activity execution, run history) is straightforward to build.

The investment is justified by the significant reduction in infrastructure complexity, Docker image size, security vulnerability surface, and operational burden.
