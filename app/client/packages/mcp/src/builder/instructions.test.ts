import {
  getCapabilities,
  TOOL_CATALOG,
  WIDGET_CATALOG,
} from "./capabilities.js";
import {
  GUIDES,
  parseFields,
  RECIPES,
  scaffoldCrudPlan,
  scaffoldFormPlan,
  SERVER_INSTRUCTIONS,
  WIDGET_REFERENCE,
} from "./instructions.js";
import { WIDGET_TYPES } from "./schema.js";

// Tools an agent could be told to call. Recipes/prompts must reference ONLY these — never a tool that doesn't exist
// yet (e.g. the data-layer tools), so we never walk the agent into a dead end.
const EXISTING_TOOLS = [
  "get_capabilities",
  "list_presets",
  "get_preset",
  "validate_app_spec",
  "build_application",
  "edit_page",
  "inspect_page",
  "list_datasources",
  "get_datasource_structure",
  "create_query",
];
// Tools that still do not exist — recipes/prompts must never reference these.
const NONEXISTENT_TOOLS = [
  "bind_widget",
  "wire_form_to_query",
  "update_layout",
];

describe("widget reference", () => {
  it("is generated from WIDGET_CATALOG and lists every schema widget type", () => {
    const text = WIDGET_REFERENCE.render();

    for (const widget of WIDGET_CATALOG) {
      expect(text).toContain(`## ${widget.type}`);
    }

    // Guards against catalog/schema drift as M3 adds widgets.
    expect(WIDGET_CATALOG.map((w) => w.type).sort()).toEqual(
      [...WIDGET_TYPES].sort(),
    );
  });

  it("never advertises binding/template syntax as an accepted field shape", () => {
    const text = WIDGET_REFERENCE.render();

    expect(text).not.toMatch(/\{\{|\}\}|\$\{/);
  });
});

describe("guides and recipes", () => {
  it("have unique slugs and non-empty bodies", () => {
    const docs = [...GUIDES, ...RECIPES, WIDGET_REFERENCE];
    const slugs = docs.map((d) => d.slug);

    expect(new Set(slugs).size).toBe(slugs.length);

    for (const doc of docs) expect(doc.render().length).toBeGreaterThan(0);
  });

  it("reference only tools that exist", () => {
    for (const recipe of RECIPES) {
      const body = recipe.render();

      for (const tool of NONEXISTENT_TOOLS) {
        expect(body).not.toContain(tool);
      }
    }
  });
});

describe("M5 store accumulation — docs stay in sync with the vocabulary", () => {
  it("documents the store binding and verbs in the widget catalog and tool catalog", () => {
    const table = WIDGET_CATALOG.find((w) => w.type === "table")!;
    const sourceDoc = (table.fields as Record<string, string>).source;

    // The table's source documents the store form alongside the query form.
    expect(sourceDoc).toContain("store");
    expect(sourceDoc).toContain("appendToStore");

    // The wire_event tool copy advertises the new verbs and the statement list.
    const wireEvent = TOOL_CATALOG.find((tool) => tool.name === "wire_event")!;

    expect(wireEvent.summary).toContain("appendToStore");
    expect(wireEvent.summary).toContain("clearStoreKey");
    expect(wireEvent.summary).toContain("statement list");
  });

  it("teaches store accumulation in the bindings guide", () => {
    const bindings = GUIDES.find((guide) => guide.slug === "bindings")!;
    const body = bindings.render();

    expect(body).toContain("appendToStore");
    expect(body).toContain("clearStoreKey");
    expect(body).toContain('{ "store": "zipResults" }');
    expect(body).toContain("SESSION-ONLY");
  });

  it("ships the originating ZIP-lookup app as a worked recipe (exact wiring)", () => {
    const recipe = RECIPES.find((doc) => doc.slug === "zip-lookup")!;
    const body = recipe.render();

    // The Lookup button: run + appendToStore with the fields projection reaching "post code" and places[0].
    expect(body).toContain('"run": "LookupZip"');
    expect(body).toContain('"appendToStore": { "key": "zipResults"');
    expect(body).toContain('{ "as": "zip", "path": ["post code"] }');
    expect(body).toContain(
      '{ "as": "city", "path": ["places", 0, "place name"] }',
    );
    expect(body).toContain('{ "as": "state", "path": ["places", 0, "state"] }');
    // The table bound to the store key.
    expect(body).toContain('source: { "store": "zipResults" }');
    // The Clear button's statement list: clearStoreKey + reset the input.
    expect(body).toContain(
      '[{ "clearStoreKey": { "key": "zipResults" } }, { "reset": "ZipInput" }]',
    );
    // Session-only (persist=false) is a documented, deliberate choice.
    expect(body).toContain("SESSION-ONLY");
    expect(body).toContain("persist=false");
  });

  it("mentions store accumulation in SERVER_INSTRUCTIONS (wire_event guidance)", () => {
    expect(SERVER_INSTRUCTIONS).toContain("appendToStore");
    expect(SERVER_INSTRUCTIONS).toContain("clearStoreKey");
  });
});

describe("M5-T3 auto-publish — docs teach publish-LAST and the automatic create-time deploy", () => {
  it("SERVER_INSTRUCTIONS describes the auto-deploy, the URLs, and the scaffold viewer copy", () => {
    expect(SERVER_INSTRUCTIONS).toContain("auto-deployed on creation");
    expect(SERVER_INSTRUCTIONS).toContain("editorUrl");
    expect(SERVER_INSTRUCTIONS).toContain("viewerUrl");
    // Publish-last guidance: finish wiring, re-publish governed, hand the viewer link last; ungoverned
    // deployments relay the editorUrl plus the governance requires message.
    expect(SERVER_INSTRUCTIONS).toContain("prepare_publish -> confirm_publish");
    expect(SERVER_INSTRUCTIONS).toContain("scaffold");
    expect(SERVER_INSTRUCTIONS).toContain("'requires' instruction");
  });

  it("build_application's catalog entry says the app is auto-deployed on creation", () => {
    const build = TOOL_CATALOG.find(
      (tool) => tool.name === "build_application",
    )!;

    expect(build.summary).toContain("auto-deployed on creation");
  });

  it("the governance gate copy gates RE-publish only (publish-on-create stays automatic)", () => {
    // Governance off: the disabled-group copy must not claim first publish is locked behind governance.
    const off = getCapabilities({ data: true, js: true, governance: false });
    const governanceGroup = off.disabledCapabilities.groups.find((group) =>
      group.tools.includes("confirm_publish"),
    )!;

    expect(governanceGroup.provides).toContain("re-publish of existing apps");
    expect(governanceGroup.provides).toContain("auto-deploy on creation");
    expect(off.governanceNote).toContain("auto-deploys");

    // Governance on: the note says publish-on-create is automatic and governance gates re-publishing.
    const on = getCapabilities({ data: true, js: true, governance: true });

    expect(on.governanceNote).toContain("Publish-on-create is automatic");
    expect(on.governanceNote).toContain("RE-publishing existing apps");
  });

  it("the crud and zip-lookup recipes end with the publish-last step", () => {
    for (const slug of ["crud", "zip-lookup"]) {
      const body = RECIPES.find((recipe) => recipe.slug === slug)!.render();

      expect(body).toContain("prepare_publish");
      expect(body).toContain("confirm_publish");
      expect(body).toContain("scaffold");
    }
  });
});

describe("M6 canvas awareness — docs stay in sync with the vocabulary", () => {
  it("patchSpec documents strict, the repair/reparent semantics, resize, and the overlap policy", () => {
    const caps = getCapabilities({ data: true, js: true, governance: true });
    const patchSpec = caps.patchSpec as Record<string, unknown>;

    expect(patchSpec.shape).toContain("'resize'");
    expect(patchSpec.shape).toContain("strict?");
    expect(patchSpec.move).toContain("strict: true");
    expect(patchSpec.move).toContain("requestedPosition");
    // The deliberate reparent semantic change is documented.
    expect(patchSpec.move).toContain("Reparenting always lands");
    expect(patchSpec.resize).toContain("rows");
    expect(patchSpec.resize).toContain("grid.rowHeightPx");
    expect(patchSpec.overlapPolicy).toContain("overlap_introduced");
    expect(patchSpec.overlapPolicy).toContain("suggestedFix");
  });

  it("the placement guide teaches the overlap gate, repair, the swap-needs-a-temp-move note, and resize", () => {
    const placement = GUIDES.find((guide) => guide.slug === "placement")!;
    const body = placement.render();

    expect(body).toContain("overlap_introduced");
    expect(body).toContain("suggestedFix");
    expect(body).toContain("strict: true");
    // Swapping two widgets needs a temporary spot.
    expect(body).toContain("temporary spot");
    expect(body).toContain('{ kind: "resize"');
    // Auto-grow + modal scroll semantics.
    expect(body).toContain("auto-grow");
    expect(body).toContain("scroll");
  });
});

describe("M7 git awareness — docs stay in sync with the tools", () => {
  it("ships a git guide teaching status-first, the mcp/ namespace, push honesty, and cleanup", () => {
    const guide = GUIDES.find((doc) => doc.slug === "git")!;
    const body = guide.render();

    // Status first, then the branch gate.
    expect(body).toContain("read_git_status");
    expect(body).toContain("branch");
    // Agent branches: reserved namespace + the push ground truth + the new applicationId pivot.
    expect(body).toContain("create_branch");
    expect(body).toContain("mcp/");
    expect(body).toContain("RESERVED");
    expect(body).toContain("PUSHES");
    expect(body).toContain("NEW applicationId");
    // Dirty-source and behind-remote teaching.
    expect(body).toContain("uncommitted changes you did not make");
    expect(body).toContain("behindCount");
    expect(body).toContain("MCP cannot pull");
    // Cleanup story: humans delete stale mcp/ branches; cap 5.
    expect(body).toContain("agents never delete branches");
    expect(body).toContain("branch UI");
    expect(body).toContain("5");
  });

  it("teaches the git workflow in SERVER_INSTRUCTIONS (gate, mcp/ branches, push, new applicationId)", () => {
    expect(SERVER_INSTRUCTIONS).toContain("read_git_status");
    expect(SERVER_INSTRUCTIONS).toContain("create_branch");
    expect(SERVER_INSTRUCTIONS).toContain("'branch' parameter");
    expect(SERVER_INSTRUCTIONS).toContain("mcp/");
    expect(SERVER_INSTRUCTIONS).toContain("PUSHES");
    expect(SERVER_INSTRUCTIONS).toContain("NEW applicationId");
  });

  it("lists both git tools in TOOL_CATALOG under the ruled gates (status always-on, branch creation governed)", () => {
    const status = TOOL_CATALOG.find(
      (tool) => tool.name === "read_git_status",
    )!;
    const branch = TOOL_CATALOG.find((tool) => tool.name === "create_branch")!;

    expect(status.gate).toBe("always");
    expect(branch.gate).toBe("governance");
    // The catalog copy carries the load-bearing facts agents skim for.
    expect(branch.summary).toContain("mcp/");
    expect(branch.summary).toContain("PUSHES");
    expect(branch.summary).toContain("applicationId");
  });

  it("get_capabilities gitSync copy reflects the gate and the reserved namespace", () => {
    const caps = getCapabilities({ data: true, js: true, governance: true });
    const gitSync = caps.gitSync as { available: boolean; note: string };

    expect(gitSync.available).toBe(true);
    expect(gitSync.note).toContain("read_git_status");
    expect(gitSync.note).toContain("create_branch");
    expect(gitSync.note).toContain("branch");
    expect(gitSync.note).toContain("mcp/");
    // T3 made committing available (mcp/-only, elicitation-confirmed); publishing stays disabled for git apps —
    // the human merges the branch via Appsmith's branch UI or a PR.
    expect(gitSync.note).toContain("Publishing from MCP stays disabled");
    expect(gitSync.note).toContain("branch UI");
  });
});

describe("prompt field parsing", () => {
  it("parses name:type pairs and normalizes types", () => {
    expect(parseFields("name:TEXT, email:EMAIL, age:NUMBER")).toEqual([
      { name: "name", inputType: "TEXT" },
      { name: "email", inputType: "EMAIL" },
      { name: "age", inputType: "NUMBER" },
    ]);
  });

  it("defaults unknown types to TEXT and strips unsafe characters from names", () => {
    expect(parseFields("full name:weird, ok:PASSWORD")).toEqual([
      { name: "fullname", inputType: "TEXT" },
      { name: "ok", inputType: "PASSWORD" },
    ]);
  });

  it("tolerates empty input", () => {
    expect(parseFields("")).toEqual([]);
  });
});

describe("scaffold prompt plans", () => {
  it("substitutes the entity and references real tools by name", () => {
    const plan = scaffoldCrudPlan("Customer", "name:TEXT, email:EMAIL");

    expect(plan).toContain("CustomerTable");
    expect(plan).toContain("name (TEXT)");
    expect(plan).toContain("email (EMAIL)");

    for (const tool of EXISTING_TOOLS.filter((t) => t !== "list_presets")) {
      // crud plan uses get_preset, validate, build, inspect, edit, capabilities
      if (plan.includes(tool)) expect(plan).toContain(tool);
    }

    expect(plan).toContain("get_preset");
    expect(plan).toContain("build_application");

    for (const tool of NONEXISTENT_TOOLS) expect(plan).not.toContain(tool);
  });

  it("sanitizes a hostile entity name", () => {
    const plan = scaffoldFormPlan("Drop; {{evil}}", "x:TEXT");

    expect(plan).not.toMatch(/\{\{|\}\}/);
    expect(plan).toContain("Dropevil");
  });

  it("handles missing fields gracefully", () => {
    expect(scaffoldCrudPlan("Order", "")).toContain("no fields parsed");
  });
});

describe("SERVER_INSTRUCTIONS stays in sync with reality (no prose drift)", () => {
  it("references only real, registered tool names", () => {
    const known = new Set(TOOL_CATALOG.map((tool) => tool.name));
    // snake_case identifiers (a tool name shape) referenced in the prose.
    const referenced =
      SERVER_INSTRUCTIONS.match(/\b[a-z][a-z0-9]*(?:_[a-z0-9]+)+\b/g) ?? [];
    const unknown = [...new Set(referenced)].filter(
      (token) => !known.has(token),
    );

    expect(unknown).toEqual([]);
  });

  it("references only known MCP enablement env vars", () => {
    const knownEnv = new Set([
      "APPSMITH_MCP_DATA_ENABLED",
      "APPSMITH_MCP_JS_ENABLED",
    ]);
    const envRefs = SERVER_INSTRUCTIONS.match(/\bAPPSMITH_[A-Z0-9_]+\b/g) ?? [];
    const unknown = [...new Set(envRefs)].filter((name) => !knownEnv.has(name));

    expect(unknown).toEqual([]);
  });
});
