import { readdirSync, readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import {
  LITERAL_PROP_OWNERS,
  UNGUARDED_LITERALS,
  widgetPropsPatchSchema,
} from "./editPatch.js";
import { WIDGET_TEMPLATES } from "./templates.js";

// Widget-property audit tripwire (APP-16052). LITERAL_PROP_OWNERS is a hand-pinned mirror of the client widgets'
// property panes: this test re-derives it from the widget sources for every buildable type and fails on any
// difference, in either direction, so a pane change (a prop added, renamed or dropped) or a table edit that names a
// widget which does not own the key points here. It also pins the vocabulary's two invariants: every literal key is
// owner-checked or explicitly unguarded, and every key read_semantic_page reports is a key patch_widgets can write.

const WIDGETS_DIR = resolve(__dirname, "../../../../src/widgets");
const STRUCTURED_REFS = new Set([
  "source",
  "value",
  "defaultValue",
  "defaultFrom",
  "imageSource",
  "visibleWhen",
  "tableData",
  "validation",
  "disableWhenInvalid",
  "reorderTabs",
]);
// The rich text editor's inputType is a different enum (html | markdown), so the Input enum stays Input-only.
const EXCLUDED_OWNERS: Record<string, readonly string[]> = {
  inputType: ["RICH_TEXT_EDITOR_WIDGET"],
};

const dirByType = new Map<string, string>();

for (const entry of readdirSync(WIDGETS_DIR, { withFileTypes: true })) {
  if (!entry.isDirectory()) continue;

  const file = resolve(WIDGETS_DIR, entry.name, "widget/index.tsx");

  if (!existsSync(file)) continue;

  const match = readFileSync(file, "utf8").match(
    /static type\s*=\s*"([A-Z0-9_]+)"/,
  );

  if (match) dirByType.set(match[1], resolve(WIDGETS_DIR, entry.name));
}

// A commented-out pane entry (the list widget's infiniteScroll, "Disabling till List V2.1") is not a property.
function stripComments(source: string): string {
  // Only a comment that starts after whitespace or at a line start: "image/*" inside a string is not one.
  return source
    .replace(/(^|\s)\/\*[\s\S]*?\*\//g, "$1")
    .replace(/(^|\s)\/\/[^\n]*/g, "$1");
}

// Per-item panel panes (a table column, a menu item, a tab) carry their own label / color / icon props that are not
// widget-level properties; drop every `panelConfig: { … }` block before matching.
const strippedPanelBlocks: string[] = [];

function stripPanelConfigs(source: string): string {
  let out = "";
  let i = 0;

  while (i < source.length) {
    const at = source.indexOf("panelConfig:", i);

    if (at < 0) {
      out += source.slice(i);
      break;
    }

    out += source.slice(i, at);

    // `panelConfig: someIdentifier` (MenuButton) is a reference, not an inline block: leave it and move on, or the
    // scanner would swallow the next unrelated brace block (a whole section of real pane entries).
    const afterColon = source.slice(at + "panelConfig:".length).match(/^\s*\{/);

    if (afterColon === null) {
      out += "panelConfig:";
      i = at + "panelConfig:".length;
      continue;
    }

    let k = source.indexOf("{", at);
    let depth = 0;

    for (; k < source.length; k += 1) {
      if (source[k] === "{") depth += 1;
      else if (source[k] === "}") {
        depth -= 1;

        if (depth === 0) break;
      }
    }

    strippedPanelBlocks.push(source.slice(at, k + 1));
    i = k + 1;
  }

  return out;
}

function paneSource(type: string): string {
  const dir = dirByType.get(type);

  if (dir === undefined) return "";

  const files = [
    resolve(dir, "widget/index.tsx"),
    resolve(dir, "widget/propertyConfig.ts"),
  ];
  const configDir = resolve(dir, "widget/propertyConfig");

  if (existsSync(configDir)) {
    for (const name of readdirSync(configDir)) {
      if (name.endsWith(".ts") && !name.includes("test")) {
        files.push(resolve(configDir, name));
      }
    }
  }

  let source = files
    .filter((file) => existsSync(file))
    .map((file) => readFileSync(file, "utf8"))
    .join("\n");

  if (/extends BaseInputWidget/.test(source)) {
    source += readFileSync(
      resolve(WIDGETS_DIR, "BaseInputWidget/widget/index.tsx"),
      "utf8",
    );
  }

  if (/extends ContainerWidget/.test(source)) {
    source += readFileSync(
      resolve(WIDGETS_DIR, "ContainerWidget/widget/index.tsx"),
      "utf8",
    );
  }

  return stripPanelConfigs(stripComments(source));
}

// Platform-level properties the widget FACTORY adds (not declared in any pane): their owners are every buildable
// type the factory does not exclude. `tabOrder` (Accessibility > Tab order) is excluded for internal wrappers and
// display-only widgets, listed in WidgetProvider/factory/helpers.ts.
const FACTORY_HELPERS = resolve(
  __dirname,
  "../../../../src/WidgetProvider/factory/helpers.ts",
);

function factoryExcludedTypes(arrayName: string): string[] {
  const source = readFileSync(FACTORY_HELPERS, "utf8");
  const start = source.indexOf(`const ${arrayName}`);

  if (start < 0) throw new Error(`${arrayName} not found in helpers.ts`);

  const body = source.slice(start, source.indexOf("];", start));

  // One quoted identifier per line: a name mentioned in a comment inside the array is not an entry.
  return [...body.matchAll(/^\s*"([A-Z0-9_]+)",?\s*$/gm)].map(
    (match) => match[1],
  );
}

const PLATFORM_OWNERS: Record<string, (types: string[]) => string[]> = {
  tabOrder: (types) => {
    const excluded = new Set([
      ...factoryExcludedTypes("TAB_ORDER_EXCLUDED_WIDGET_TYPES"),
      ...factoryExcludedTypes("TAB_ORDER_NON_FOCUSABLE_WIDGET_TYPES"),
    ]);

    return types.filter(
      (type) => !type.startsWith("WDS_") && !excluded.has(type),
    );
  },
};

const buildableTypes = [
  ...new Set(Object.values(WIDGET_TEMPLATES).map((t) => t.appsmithType)),
].sort();
const paneByType = new Map(buildableTypes.map((t) => [t, paneSource(t)]));
const literalKeys = Object.keys(
  widgetPropsPatchSchema._def.schema.shape,
).filter((key) => !STRUCTURED_REFS.has(key));

describe("LITERAL_PROP_OWNERS matches the client widgets' property panes", () => {
  it("strips only per-item panel blocks (each carries a panel id / editable title), never a pane section", () => {
    // paneByType is built at module load, so every stripped block is already recorded. A block without the panel
    // markers would mean the scanner swallowed an unrelated brace block (a real pane section) after a
    // `panelConfig:` that was not an inline object.
    expect(strippedPanelBlocks.length).toBeGreaterThan(0);

    for (const block of strippedPanelBlocks) {
      expect(block.startsWith("panelConfig:")).toBe(true);
      expect(/panelIdPropertyName|editableTitle/.test(block)).toBe(true);
    }
  });

  it("does not count a commented-out pane entry as an owner (ListWidgetV2's disabled infiniteScroll)", () => {
    const pattern = /propertyName:\s*"infiniteScroll"/;

    expect(
      buildableTypes.filter((type) => pattern.test(paneByType.get(type) ?? "")),
    ).toEqual([]);
  });

  it("resolves a pane source for every buildable widget type", () => {
    expect(buildableTypes.length).toBeGreaterThanOrEqual(46);

    for (const type of buildableTypes) {
      expect(paneByType.get(type)).not.toBe("");
    }
  });

  it("owner-checks every literal key that is not explicitly unguarded", () => {
    for (const key of literalKeys) {
      const guarded = key in LITERAL_PROP_OWNERS;
      const unguarded = UNGUARDED_LITERALS.has(key);

      expect({ key, guarded, unguarded }).toEqual({
        key,
        guarded: !unguarded,
        unguarded,
      });
    }
  });

  it("lists exactly the buildable widget types whose pane declares each owned key", () => {
    const drift: Record<string, { expected: string[]; actual: string[] }> = {};

    for (const [key, owners] of Object.entries(LITERAL_PROP_OWNERS)) {
      const pattern = new RegExp(`propertyName:\\s*"${key}"`);
      const expected =
        key in PLATFORM_OWNERS
          ? PLATFORM_OWNERS[key](buildableTypes)
          : buildableTypes.filter(
              (type) =>
                pattern.test(paneByType.get(type) ?? "") &&
                !(EXCLUDED_OWNERS[key] ?? []).includes(type),
            );
      const actual = [...owners].sort();

      if (JSON.stringify(expected) !== JSON.stringify(actual)) {
        drift[key] = { expected, actual };
      }
    }

    expect(drift).toEqual({});
  });
});
