import { readdirSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { WIDGET_TEMPLATES } from "./templates.js";

// M4-T6 — widget-version drift tripwire.
//
// The compiler stamps each widget's DSL `version` (WIDGET_TEMPLATES). It MUST equal the client widget's current
// version: if the client bumps a widget's version and we keep emitting the old one, the client's migrateDSL rewrites
// our widget on load (e.g. a version bump that restructures props), so an MCP-built app renders wrong. This test reads
// the version straight from each client widget's `static getConfig()` and fails — pointing here — when they diverge.
// We read source (not import) for the same reason dsl-version.test.ts does: importing a widget pulls the whole widget
// runtime. Scope is VERSIONS (the drift that triggers migration); default-prop drift is a separate, harder check.

const WIDGETS_DIR = resolve(__dirname, "../../../../src/widgets");

// The widget's DSL version is the SHALLOWEST-indented `version:` inside its `static getConfig()` — nested blueprint /
// child-config `version:` fields are always more deeply indented (verified against TABS_WIDGET, whose getConfig has
// nested version:1 fields plus the real top-level version:3).
function clientWidgetVersion(appsmithType: string): number | undefined {
  const source = readClientWidgetSource(appsmithType);

  if (source === undefined) return undefined;

  const start = source.search(/static getConfig\s*\(\)/);

  if (start < 0) return undefined;

  // The top-level getConfig `version:` is expected within this window; every current widget's getConfig is well under
  // it. If a future widget's getConfig grows past 12000 chars before its version, this under-reads → the test fails
  // (safe direction, points here) rather than silently passing drift.
  const block = source.slice(start, start + 12000);
  let best: { indent: number; version: number } | undefined;

  for (const match of block.matchAll(/^([ \t]*)version:\s*(\d+)/gm)) {
    const indent = match[1].length;

    if (best === undefined || indent < best.indent) {
      best = { indent, version: Number(match[2]) };
    }
  }

  return best?.version;
}

// Locate a widget's `widget/index.tsx` by its `static type = "<APPSMITH_TYPE>"` declaration. The directory name does
// not map 1:1 to the type (CheckboxWidget -> CHECKBOX_WIDGET, MultiSelectWidgetV2 -> MULTI_SELECT_WIDGET_V2), so we
// scan the widget dirs and match on the declaration rather than guessing the path.
const widgetSourceCache = new Map<string, string | undefined>();

function readClientWidgetSource(appsmithType: string): string | undefined {
  if (widgetSourceCache.size === 0) {
    // Lazily index every widget's index.tsx by its declared static type.
    for (const entry of readdirSync(WIDGETS_DIR, { withFileTypes: true })) {
      if (!entry.isDirectory()) continue;

      const file = resolve(WIDGETS_DIR, entry.name, "widget/index.tsx");
      let source: string;

      try {
        source = readFileSync(file, "utf8");
      } catch {
        continue;
      }

      const typeMatch = source.match(/static type\s*=\s*"([A-Z0-9_]+)"/);

      if (typeMatch) widgetSourceCache.set(typeMatch[1], source);
    }
  }

  return widgetSourceCache.get(appsmithType);
}

// LIST_WIDGET_V2 (the card grid) declares no `version:` in getConfig — it is a meta-widget whose template is cloned
// per row. Its emitted version (3) was verified by live rendering; there is no client getConfig version to diff, so it
// is asserted explicitly rather than auto-extracted.
const NO_GETCONFIG_VERSION: Record<string, number> = {
  LIST_WIDGET_V2: 3,
  // RATE_WIDGET declares no version anywhere (getConfig or getDefaults) — a versionless widget cannot drift, so
  // the template uses the conventional 1, asserted explicitly here.
  RATE_WIDGET: 1,
};

describe("widget-version drift tripwire (M4-T6)", () => {
  const entries = Object.entries(WIDGET_TEMPLATES);

  it.each(entries)(
    "%s template version matches the client widget's getConfig version",
    (_mcpType, template) => {
      const explicit = NO_GETCONFIG_VERSION[template.appsmithType];

      if (explicit !== undefined) {
        // Documented exception: no client getConfig version to diff. At least assert the widget type still exists.
        expect(readClientWidgetSource(template.appsmithType)).toBeDefined();
        expect(template.version).toBe(explicit);

        return;
      }

      const clientVersion = clientWidgetVersion(template.appsmithType);

      // A defined client version proves the widget type resolved; equality proves no silent migration-triggering drift.
      expect(clientVersion).toBeDefined();
      expect(template.version).toBe(clientVersion);
    },
  );
});
