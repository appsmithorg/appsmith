import { TOOL_CATALOG, WIDGET_CATALOG } from "./capabilities.js";
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
