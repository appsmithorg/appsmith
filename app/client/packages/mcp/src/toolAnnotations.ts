import type { ToolAnnotations } from "@modelcontextprotocol/sdk/types.js";

// MCP tool annotations for every registered tool. Hosted clients gate approvals on them: Codex / the ChatGPT app
// treats a tool with NO annotations as destructive and open-world, so it demands a human approval for every call
// (and under its non-interactive policy simply refuses, which the model then reports as "no usable tools").
// Claude ignores them. The table is exhaustive: buildMcpServer refuses to register a tool that is missing here,
// and toolAnnotations.test.ts pins the table against the live tool list so a new tool cannot ship un-annotated.
//
// Semantics (MCP spec): readOnlyHint — no state change; destructiveHint — may irreversibly change or delete
// state (only meaningful when readOnlyHint is false); idempotentHint — repeating with the same arguments has no
// additional effect; openWorldHint — reaches outside the Appsmith instance (a customer's git remote, a datasource).

// Reads and lists against the Appsmith backend only.
const READ: ToolAnnotations = {
  readOnlyHint: true,
  destructiveHint: false,
  idempotentHint: true,
  openWorldHint: false,
};

// Non-destructive writes to the app's unpublished edit copy (layouts, pages, queries, JS objects, theme tokens):
// revision-checked and recorded as governed changes. Only layout edits carry a rollback snapshot; the deployed app
// cannot change without the destructive confirm_publish / confirm_commit handshake.
const WRITE: ToolAnnotations = {
  readOnlyHint: false,
  destructiveHint: false,
  idempotentHint: false,
  openWorldHint: false,
};

// Idempotent writes: the handler looks the entity up by name first and returns the existing one on a repeat call
// (create_datasource and the create_*_query tools). create_page, duplicate_action and create_js_object do no such
// lookup, so they stay plain WRITE.
const WRITE_IDEMPOTENT: ToolAnnotations = { ...WRITE, idempotentHint: true };

// The confirm_* half of a destructive handshake: irreversible via MCP (delete, deploy to everyone, rollback).
const DESTRUCTIVE: ToolAnnotations = {
  readOnlyHint: false,
  destructiveHint: true,
  idempotentHint: false,
  openWorldHint: false,
};

// Side effects that leave the instance: a push to the customer's git remote, or executing an action against a
// datasource.
const WRITE_EXTERNAL: ToolAnnotations = { ...WRITE, openWorldHint: true };
const DESTRUCTIVE_EXTERNAL: ToolAnnotations = {
  ...DESTRUCTIVE,
  openWorldHint: true,
};

export const TOOL_ANNOTATIONS: Readonly<Record<string, ToolAnnotations>> = {
  // Discovery and reads.
  list_workspaces: READ,
  resolve_workspace: READ,
  list_applications: READ,
  get_application_context: READ,
  read_git_status: READ,
  get_capabilities: READ,
  get_guide: READ,
  list_presets: READ,
  get_preset: READ,
  validate_app_spec: READ,
  inspect_page: READ,
  read_semantic_page: READ,
  read_pages: READ,
  read_publish_status: READ,
  read_theme: READ,
  list_changes: READ,
  get_change: READ,
  list_all_changes: READ,
  get_any_change: READ,
  get_change_diff: READ,
  list_datasources: READ,
  get_datasource_structure: READ,
  list_actions: READ,
  get_action: READ,
  read_js_object: READ,
  // run_action executes only provably read-only actions (server-verified), but it does reach the datasource.
  run_action: { ...READ, idempotentHint: false, openWorldHint: true },

  // Authoring writes.
  build_application: WRITE,
  edit_page: WRITE,
  patch_widgets: WRITE,
  wire_event: WRITE,
  update_theme: WRITE,
  create_page: WRITE,
  rename_page: WRITE,
  create_datasource: WRITE_IDEMPOTENT,
  create_query: WRITE_IDEMPOTENT,
  create_rest_api: WRITE_IDEMPOTENT,
  create_mongo_query: WRITE_IDEMPOTENT,
  create_redis_query: WRITE_IDEMPOTENT,
  create_ai_query: WRITE_IDEMPOTENT,
  create_s3_query: WRITE_IDEMPOTENT,
  create_graphql_query: WRITE_IDEMPOTENT,
  create_sheets_query: WRITE_IDEMPOTENT,
  update_action: WRITE,
  duplicate_action: WRITE,
  create_js_object: WRITE,
  update_js_object: WRITE,
  // Creating an agent branch pushes the ref to the customer's remote.
  create_branch: WRITE_EXTERNAL,

  // prepare_* mints a one-time confirmation and changes nothing else.
  prepare_rollback: WRITE,
  prepare_publish: WRITE,
  prepare_commit: WRITE,
  prepare_delete_page: WRITE,
  prepare_delete_action: WRITE,
  prepare_run_action: WRITE,
  prepare_delete_js_object: WRITE,

  // confirm_* executes the irreversible half.
  confirm_rollback: DESTRUCTIVE,
  confirm_publish: DESTRUCTIVE,
  confirm_delete_page: DESTRUCTIVE,
  confirm_delete_action: DESTRUCTIVE,
  confirm_delete_js_object: DESTRUCTIVE,
  // Commit always pushes to the remote; a confirmed run executes an arbitrary action against its datasource.
  confirm_commit: DESTRUCTIVE_EXTERNAL,
  confirm_run_action: DESTRUCTIVE_EXTERNAL,
};
