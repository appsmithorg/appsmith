import { applyWidgetPatch } from "./editPatch.js";
import type { WidgetNode } from "./layout.js";
import { lintDsl } from "./lint.js";
import {
  canvasColumns,
  cascadeFit,
  clampRow,
  collectOverlapPairs,
  collisions,
  computeCanvasOverlapFixes,
  contentExtent,
  MAX_ROW,
  nearestFreePosition,
  overlapDelta,
  overlappingPairs,
  pairKey,
  rangesOverlap,
  rectOf,
  suggestedFix,
} from "./occupancy.js";

function widget(
  overrides: Partial<WidgetNode> & { widgetId: string },
): WidgetNode {
  return {
    widgetName: overrides.widgetId,
    type: "INPUT_WIDGET_V2",
    topRow: 0,
    bottomRow: 7,
    leftColumn: 0,
    rightColumn: 24,
    ...overrides,
  };
}

function rootCanvas(children: WidgetNode[]): WidgetNode {
  return {
    widgetId: "0",
    widgetName: "MainContainer",
    type: "CANVAS_WIDGET",
    topRow: 0,
    bottomRow: 380,
    leftColumn: 0,
    rightColumn: 640,
    children,
  };
}

describe("occupancy — intersect predicate", () => {
  it("uses half-open ranges: edge-touching is NOT overlap", () => {
    expect(rangesOverlap(0, 10, 10, 20)).toBe(false);
    expect(rangesOverlap(0, 10, 9, 20)).toBe(true);
    expect(rangesOverlap(10, 20, 0, 10)).toBe(false);
    expect(rangesOverlap(5, 6, 0, 100)).toBe(true);
  });

  it("rectOf skips non-numeric and NaN rects", () => {
    expect(
      rectOf(widget({ widgetId: "a", topRow: Number.NaN })),
    ).toBeUndefined();
    expect(
      rectOf(widget({ widgetId: "a", bottomRow: "12" as unknown as number })),
    ).toBeUndefined();
    expect(
      rectOf(widget({ widgetId: "a", leftColumn: Infinity })),
    ).toBeUndefined();
    expect(rectOf(widget({ widgetId: "a" }))).toEqual({
      topRow: 0,
      bottomRow: 7,
      leftColumn: 0,
      rightColumn: 24,
    });
  });
});

describe("occupancy — collisions", () => {
  const children = [
    widget({ widgetId: "A", topRow: 0, bottomRow: 10 }),
    widget({ widgetId: "B", topRow: 12, bottomRow: 20 }),
    // Detached overlay (a modal): its nominal rect covers everything but never collides.
    widget({
      widgetId: "M",
      topRow: 0,
      bottomRow: 100,
      rightColumn: 64,
      detachFromLayout: true,
    }),
    // Corrupt rect: skipped, never computed with.
    widget({ widgetId: "N", topRow: Number.NaN }),
  ];

  it("returns colliding names, honoring the exclude list", () => {
    const rect = { topRow: 5, bottomRow: 15, leftColumn: 0, rightColumn: 10 };

    expect(collisions(children, rect)).toEqual(["A", "B"]);
    expect(collisions(children, rect, ["A"])).toEqual(["B"]);
  });

  it("excludes detached widgets and non-numeric rects", () => {
    const rect = { topRow: 30, bottomRow: 40, leftColumn: 0, rightColumn: 10 };

    expect(collisions(children, rect)).toEqual([]);
  });
});

describe("occupancy — nearestFreePosition", () => {
  it("returns the preferred position when it is free", () => {
    const children = [widget({ widgetId: "A", topRow: 0, bottomRow: 10 })];

    expect(
      nearestFreePosition(
        children,
        { rows: 5, columns: 24 },
        { topRow: 10, leftColumn: 0 },
        64,
      ),
    ).toEqual({ topRow: 10, leftColumn: 0 });
  });

  it("pushes down past the lowest colliding bottom edge (+1 gap), chaining over stacked colliders", () => {
    const children = [
      widget({ widgetId: "A", topRow: 0, bottomRow: 10 }),
      widget({ widgetId: "B", topRow: 11, bottomRow: 20 }),
    ];
    const position = nearestFreePosition(
      children,
      { rows: 5, columns: 24 },
      { topRow: 2, leftColumn: 0 },
      64,
    );

    // 2 collides with A -> 11 collides with B -> 21 free.
    expect(position).toEqual({ topRow: 21, leftColumn: 0 });
  });

  it("is deterministic (same input, same output)", () => {
    const children = [
      widget({ widgetId: "B", topRow: 11, bottomRow: 20 }),
      widget({ widgetId: "A", topRow: 0, bottomRow: 10 }),
    ];
    const run = () =>
      nearestFreePosition(
        children,
        { rows: 5, columns: 24 },
        { topRow: 0, leftColumn: 0 },
        64,
      );

    expect(run()).toEqual(run());
    expect(run()).toEqual({ topRow: 21, leftColumn: 0 });
  });

  it("clamps the column into the CANVAS'S OWN width, not the global grid", () => {
    // A 24-wide widget preferred at leftColumn 20 inside a 32-column inner canvas: clamp to 8.
    expect(
      nearestFreePosition(
        [],
        { rows: 5, columns: 24 },
        { topRow: 0, leftColumn: 20 },
        32,
      ),
    ).toEqual({ topRow: 0, leftColumn: 8 });
  });

  it("ignores detached and NaN-rect obstacles", () => {
    const children = [
      widget({
        widgetId: "M",
        topRow: 0,
        bottomRow: 100,
        detachFromLayout: true,
      }),
      widget({ widgetId: "N", topRow: Number.NaN }),
    ];

    expect(
      nearestFreePosition(
        children,
        { rows: 5, columns: 24 },
        { topRow: 3, leftColumn: 0 },
        64,
      ),
    ).toEqual({ topRow: 3, leftColumn: 0 });
  });

  it("clamps written rows to MAX_ROW and terminates", () => {
    const children = [
      widget({ widgetId: "A", topRow: 0, bottomRow: MAX_ROW + 100 }),
    ];
    const position = nearestFreePosition(
      children,
      { rows: 5, columns: 24 },
      { topRow: 0, leftColumn: 0 },
      64,
    );

    expect(position.topRow).toBeLessThanOrEqual(MAX_ROW);
  });

  it("clampRow rounds, floors at 0, and caps at MAX_ROW", () => {
    expect(clampRow(-5)).toBe(0);
    expect(clampRow(3.6)).toBe(4);
    expect(clampRow(MAX_ROW + 1)).toBe(MAX_ROW);
    expect(clampRow(Number.MAX_SAFE_INTEGER + 2)).toBe(MAX_ROW);
  });
});

describe("occupancy — canvasColumns", () => {
  it("uses the 64-column grid for the root canvas and rightColumn for inner canvases", () => {
    expect(canvasColumns(rootCanvas([]))).toBe(64);
    expect(
      canvasColumns(
        widget({ widgetId: "c1", type: "CANVAS_WIDGET", rightColumn: 32 }),
      ),
    ).toBe(32);
  });
});

describe("occupancy — overlappingPairs (extracted lint predicate)", () => {
  it("finds intersecting sibling pairs and skips detached/non-numeric children", () => {
    const children = [
      widget({ widgetId: "A", topRow: 0, bottomRow: 10 }),
      widget({ widgetId: "B", topRow: 5, bottomRow: 15 }),
      widget({
        widgetId: "M",
        topRow: 0,
        bottomRow: 50,
        detachFromLayout: true,
      }),
      widget({ widgetId: "N", topRow: Number.NaN }),
    ];
    const pairs = overlappingPairs(children).map((pair) => [
      pair.a.widgetName,
      pair.b.widgetName,
    ]);

    expect(pairs).toEqual([["A", "B"]]);
  });

  it("does not report edge-touching siblings", () => {
    const children = [
      widget({ widgetId: "A", topRow: 0, bottomRow: 10 }),
      widget({ widgetId: "B", topRow: 10, bottomRow: 20 }),
    ];

    expect(overlappingPairs(children)).toEqual([]);
  });
});

describe("occupancy — overlapDelta (the commitLayout gate core)", () => {
  function overlappingPage(): WidgetNode {
    return rootCanvas([
      widget({ widgetId: "A", topRow: 0, bottomRow: 10 }),
      widget({ widgetId: "B", topRow: 5, bottomRow: 15 }),
      widget({ widgetId: "C", topRow: 20, bottomRow: 30 }),
    ]);
  }

  it("reports a pair present after but not before", () => {
    const before = rootCanvas([
      widget({ widgetId: "A", topRow: 0, bottomRow: 10 }),
      widget({ widgetId: "B", topRow: 12, bottomRow: 20 }),
    ]);
    const after = rootCanvas([
      widget({ widgetId: "A", topRow: 0, bottomRow: 10 }),
      widget({ widgetId: "B", topRow: 5, bottomRow: 15 }),
    ]);
    const delta = overlapDelta(before, after);

    expect(delta.introduced).toEqual([{ a: "A", b: "B" }]);
    expect(delta.fixOperations.length).toBeGreaterThan(0);
  });

  it("never gates carried (pre-existing) overlaps", () => {
    const before = overlappingPage();
    const after = overlappingPage();

    expect(overlapDelta(before, after).introduced).toEqual([]);
  });

  it("name-pair keys: two already-overlapping widgets reparented TOGETHER stay pre-existing", () => {
    const before = overlappingPage();
    // A and B moved (still overlapping, same relative rects) into a container's inner canvas.
    const inner: WidgetNode = {
      ...widget({ widgetId: "c1", type: "CANVAS_WIDGET", rightColumn: 40 }),
      widgetName: "Canvas1",
      bottomRow: 40,
      children: [
        widget({ widgetId: "A", topRow: 0, bottomRow: 10 }),
        widget({ widgetId: "B", topRow: 5, bottomRow: 15 }),
      ],
    };
    const container: WidgetNode = {
      ...widget({ widgetId: "ct", type: "CONTAINER_WIDGET", rightColumn: 40 }),
      widgetName: "Card",
      bottomRow: 40,
      children: [inner],
    };
    const after = rootCanvas([
      container,
      widget({ widgetId: "C", topRow: 41, bottomRow: 50 }),
    ]);

    expect(overlapDelta(before, after).introduced).toEqual([]);
  });

  it("multi-op patches diff initial vs FINAL state (a transient overlap that is fixed again does not gate)", () => {
    const before = rootCanvas([
      widget({ widgetId: "A", topRow: 0, bottomRow: 10 }),
      widget({ widgetId: "B", topRow: 12, bottomRow: 20 }),
    ]);
    // op1 moved A onto B, op2 moved A back — the final DSL equals the initial one.
    const after = rootCanvas([
      widget({ widgetId: "A", topRow: 0, bottomRow: 10 }),
      widget({ widgetId: "B", topRow: 12, bottomRow: 20 }),
    ]);

    expect(overlapDelta(before, after).introduced).toEqual([]);
  });

  it("excludes detached (modal) rects from the pair sets", () => {
    const before = rootCanvas([
      widget({ widgetId: "A", topRow: 0, bottomRow: 10 }),
    ]);
    const after = rootCanvas([
      widget({ widgetId: "A", topRow: 0, bottomRow: 10 }),
      widget({
        widgetId: "M",
        type: "MODAL_WIDGET",
        topRow: 0,
        bottomRow: 24,
        detachFromLayout: true,
      }),
    ]);

    expect(overlapDelta(before, after).introduced).toEqual([]);
  });

  it("collectOverlapPairs keys pairs by sorted names, canvas-independent", () => {
    const pairs = collectOverlapPairs(overlappingPage());

    expect([...pairs.keys()]).toEqual([pairKey("B", "A")]);
    expect(pairKey("B", "A")).toBe(pairKey("A", "B"));
  });
});

describe("occupancy — computeCanvasOverlapFixes (sequential simulated occupancy)", () => {
  it("clears a multi-overlap canvas with conflict-free sequential moves (round-trip)", () => {
    // Three mutually overlapping widgets. The fix must keep the top-most and move the others to spots computed
    // against the SIMULATED state so applying the whole payload clears every diagnostic.
    const page = rootCanvas([
      widget({ widgetId: "A", topRow: 0, bottomRow: 10 }),
      widget({ widgetId: "B", topRow: 4, bottomRow: 14 }),
      widget({ widgetId: "C", topRow: 8, bottomRow: 18 }),
    ]);
    const operations = computeCanvasOverlapFixes(page);

    expect(operations.length).toBeGreaterThan(0);

    // Every emitted suggestion validates against the patch schema and applies cleanly.
    const { dsl } = applyWidgetPatch(page, { operations });
    const rules = lintDsl(dsl).issues.map((issue) => issue.rule);

    expect(rules).not.toContain("overlap");
  });

  it("fixes only the requested pairs, leaving carried overlaps alone", () => {
    const page = rootCanvas([
      // Carried mess: A/B overlap and are NOT in the fix set.
      widget({ widgetId: "A", topRow: 0, bottomRow: 10 }),
      widget({ widgetId: "B", topRow: 5, bottomRow: 15 }),
      // The introduced pair: C/D.
      widget({ widgetId: "C", topRow: 20, bottomRow: 30 }),
      widget({ widgetId: "D", topRow: 25, bottomRow: 35 }),
    ]);
    const operations = computeCanvasOverlapFixes(
      page,
      new Set([pairKey("C", "D")]),
    );

    expect(operations).toHaveLength(1);
    expect(operations[0]).toMatchObject({ kind: "move", name: "D" });

    const { dsl } = applyWidgetPatch(page, { operations });
    const pairs = overlappingPairs(dsl.children ?? []).map((pair) =>
      pairKey(pair.a.widgetName, pair.b.widgetName),
    );

    expect(pairs).toEqual([pairKey("A", "B")]);
  });

  it("suggestedFix wraps operations and caps them at the schema's 50-op limit", () => {
    expect(suggestedFix([])).toBeUndefined();

    const many = Array.from({ length: 60 }, (_, i) => ({
      kind: "move" as const,
      name: `W${i}`,
      position: { topRow: i, leftColumn: 0 },
    }));

    expect(suggestedFix(many)?.operations).toHaveLength(50);
    expect(suggestedFix(many)?.tool).toBe("patch_widgets");
  });
});

describe("occupancy — cascadeFit (container fit, section D)", () => {
  function containerWith(children: WidgetNode[], bottomRow: number) {
    const inner: WidgetNode = {
      widgetId: "innerCanvas",
      widgetName: "Canvas1",
      type: "CANVAS_WIDGET",
      topRow: 0,
      bottomRow,
      leftColumn: 0,
      rightColumn: 40,
      children,
    };

    return {
      inner,
      container: {
        widgetId: "card",
        widgetName: "Card",
        type: "CONTAINER_WIDGET",
        topRow: 0,
        bottomRow,
        leftColumn: 0,
        rightColumn: 40,
        children: [inner],
      } as WidgetNode,
    };
  }

  it("grows the container chain and pushes below-siblings down, recording every adjustment", () => {
    const inside = widget({ widgetId: "Field", topRow: 0, bottomRow: 30 });
    const { container } = containerWith([inside], 20);
    const below = widget({
      widgetId: "Below",
      topRow: 21,
      bottomRow: 28,
      mobileTopRow: 21,
      mobileBottomRow: 28,
    });
    const root = rootCanvas([container, below]);
    const { adjustments, notes } = cascadeFit(root, "Field");

    // Container grew to fit the 30-row content...
    expect(container.bottomRow).toBe(30);
    // ...and the widget below it was pushed past the grown container (+1 gap).
    expect(below.topRow).toBe(31);
    expect(below.bottomRow).toBe(38);
    // Mobile mirrors follow the desktop rows.
    expect(below.mobileTopRow).toBe(31);
    expect(below.mobileBottomRow).toBe(38);

    const kinds = adjustments.map((a) => `${a.kind}:${a.widgetName}`);

    expect(kinds).toContain("resize:Card");
    expect(kinds).toContain("move:Below");
    expect(notes.join(" ")).toContain("Card");
    expect(notes.join(" ")).toContain("Below");

    // The final result introduces no overlap (what the delta gate checks).
    expect(overlapDelta(root, root).introduced).toEqual([]);
    expect(overlappingPairs(root.children ?? [])).toEqual([]);
  });

  it("warns (never grows) when a modal body outgrows the modal's pixel height", () => {
    const field = widget({ widgetId: "Field", topRow: 0, bottomRow: 40 });
    const inner: WidgetNode = {
      widgetId: "modalCanvas",
      widgetName: "Canvas1",
      type: "CANVAS_WIDGET",
      topRow: 0,
      bottomRow: 24,
      leftColumn: 0,
      rightColumn: 32,
      children: [field],
    };
    const modal: WidgetNode = {
      widgetId: "m1",
      widgetName: "AddModal",
      type: "MODAL_WIDGET",
      topRow: 0,
      bottomRow: 24,
      leftColumn: 0,
      rightColumn: 32,
      height: 252,
      detachFromLayout: true,
      children: [inner],
    };
    const root = rootCanvas([modal]);
    const { adjustments, notes } = cascadeFit(root, "Field");

    // 40 rows x 10px = 400px > 252px: warn with the executable resize, do not grow, do not push root siblings.
    expect(notes.join(" ")).toContain("AddModal");
    expect(notes.join(" ")).toContain("scroll");
    expect(notes.join(" ")).toContain("rows: 40");
    expect(modal.height).toBe(252);
    expect(adjustments.filter((a) => a.widgetName === "AddModal")).toEqual([]);
  });

  it("leaves carried overlaps between other widgets untouched", () => {
    const grown = widget({ widgetId: "Grown", topRow: 0, bottomRow: 10 });
    const carriedA = widget({ widgetId: "CarA", topRow: 40, bottomRow: 50 });
    const carriedB = widget({ widgetId: "CarB", topRow: 45, bottomRow: 55 });
    const root = rootCanvas([grown, carriedA, carriedB]);
    const { adjustments } = cascadeFit(root, "Grown");

    expect(adjustments).toEqual([]);
    expect(carriedA.topRow).toBe(40);
    expect(carriedB.topRow).toBe(45);
  });

  it("contentExtent measures in-flow numeric children only", () => {
    const canvas = rootCanvas([
      widget({ widgetId: "A", topRow: 0, bottomRow: 12 }),
      widget({
        widgetId: "M",
        topRow: 0,
        bottomRow: 99,
        detachFromLayout: true,
      }),
      widget({ widgetId: "N", bottomRow: Number.NaN }),
    ]);

    expect(contentExtent(canvas)).toBe(12);
  });
});
