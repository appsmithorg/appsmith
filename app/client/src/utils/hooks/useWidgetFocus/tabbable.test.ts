import {
  buildTabSequence,
  getEntryTabbables,
  getNextTabbableDescendant,
  getSiblingTabbables,
  getTabbableDescendants,
  sortWidgetsByPosition,
} from "./tabbable";

interface WidgetOptions {
  top: number;
  left: number;
  tabOrder?: string;
}

function makeWidget(id: string, { left, tabOrder, top }: WidgetOptions) {
  const element = document.createElement("div");

  element.className = "positioned-widget";
  element.id = id;

  if (tabOrder !== undefined) {
    element.setAttribute("data-taborder", tabOrder);
  }

  element.getBoundingClientRect = () =>
    ({
      top,
      left,
      bottom: top + 40,
      right: left + 100,
      width: 100,
      height: 40,
      x: left,
      y: top,
    }) as DOMRect;

  return element;
}

function ids(elements: HTMLElement[]) {
  return elements.map((element) => element.id);
}

describe("getNextTabbableDescendant", () => {
  it("should return undefined if no descendants are passed", () => {
    expect(getNextTabbableDescendant([])).toBeUndefined();
  });
});

describe("getSiblingTabbables", () => {
  it("matches legacy position-based sorting when no widget has a tab order", () => {
    const active = makeWidget("active", { top: 100, left: 0 });
    const siblings = [
      makeWidget("a", { top: 0, left: 0 }),
      makeWidget("b", { top: 200, left: 0 }),
      makeWidget("c", { top: 100, left: 50 }),
    ];

    const legacyForward = sortWidgetsByPosition(
      { top: 100, left: 0 },
      siblings,
      false,
    );
    const legacyBackward = sortWidgetsByPosition(
      { top: 100, left: 0 },
      siblings,
      true,
    );

    expect(ids(getSiblingTabbables(active, siblings, false))).toEqual(
      ids(legacyForward),
    );
    expect(ids(getSiblingTabbables(active, siblings, true))).toEqual(
      ids(legacyBackward),
    );
  });

  it("follows explicit tab order regardless of visual position", () => {
    const active = makeWidget("active", { top: 0, left: 0, tabOrder: "1" });
    const siblings = [
      makeWidget("third", { top: 0, left: 100, tabOrder: "3" }),
      makeWidget("second", { top: 300, left: 0, tabOrder: "2" }),
    ];

    expect(ids(getSiblingTabbables(active, siblings, false))).toEqual([
      "second",
      "third",
    ]);
  });

  it("places explicitly ordered widgets before position-ordered ones (HTML semantics)", () => {
    const a = makeWidget("a", { top: 0, left: 0 });
    const b = makeWidget("b", { top: 100, left: 0, tabOrder: "2" });
    const c = makeWidget("c", { top: 200, left: 0 });
    const d = makeWidget("d", { top: 300, left: 0, tabOrder: "1" });

    expect(ids(buildTabSequence([a, b, c, d]))).toEqual(["d", "b", "a", "c"]);

    // tabbing forward from the last explicit widget lands on the first implicit one
    expect(ids(getSiblingTabbables(b, [a, c, d], false))).toEqual(["a", "c"]);
  });

  it("returns elements before the active widget reversed for shift+tab", () => {
    const a = makeWidget("a", { top: 0, left: 0 });
    const b = makeWidget("b", { top: 100, left: 0, tabOrder: "2" });
    const c = makeWidget("c", { top: 200, left: 0 });
    const d = makeWidget("d", { top: 300, left: 0, tabOrder: "1" });

    // sequence is d, b, a, c — shift+tab from a goes back to b, then d
    expect(ids(getSiblingTabbables(a, [b, c, d], true))).toEqual(["b", "d"]);

    // shift+tab from the first widget in the sequence yields nothing,
    // which triggers the parent-canvas recursion upstream
    expect(getSiblingTabbables(d, [a, b, c], true)).toEqual([]);
  });

  it("breaks ties on the same tab order by position", () => {
    const active = makeWidget("active", { top: 500, left: 0, tabOrder: "2" });
    const lower = makeWidget("lower", { top: 200, left: 0, tabOrder: "1" });
    const upper = makeWidget("upper", { top: 100, left: 0, tabOrder: "1" });

    expect(ids(getSiblingTabbables(active, [lower, upper], true))).toEqual([
      "lower",
      "upper",
    ]);
  });

  it("ignores invalid tab order values and falls back to position-based sorting", () => {
    const active = makeWidget("active", { top: 100, left: 0, tabOrder: "0" });
    const siblings = [
      makeWidget("a", { top: 0, left: 0, tabOrder: "-2" }),
      makeWidget("b", { top: 200, left: 0, tabOrder: "abc" }),
      makeWidget("c", { top: 300, left: 0, tabOrder: "1.5" }),
    ];

    const legacy = sortWidgetsByPosition(
      { top: 100, left: 0 },
      siblings,
      false,
    );

    expect(ids(getSiblingTabbables(active, siblings, false))).toEqual(
      ids(legacy),
    );
  });
});

describe("getEntryTabbables", () => {
  const anchor = { top: 0, left: 0 };

  it("matches legacy position-based sorting when no widget has a tab order", () => {
    const candidates = [
      makeWidget("b", { top: 200, left: 0 }),
      makeWidget("a", { top: 100, left: 0 }),
    ];

    expect(ids(getEntryTabbables(anchor, candidates, false))).toEqual(
      ids(sortWidgetsByPosition(anchor, candidates, false)),
    );
  });

  it("enters at the lowest tab order first when tabbing forward", () => {
    const candidates = [
      makeWidget("a", { top: 0, left: 0 }),
      makeWidget("b", { top: 100, left: 0, tabOrder: "2" }),
      makeWidget("c", { top: 200, left: 0, tabOrder: "1" }),
    ];

    expect(ids(getEntryTabbables(anchor, candidates, false))).toEqual([
      "c",
      "b",
      "a",
    ]);
  });

  it("enters at the end of the sequence when tabbing backward", () => {
    const candidates = [
      makeWidget("a", { top: 0, left: 0 }),
      makeWidget("b", { top: 100, left: 0, tabOrder: "2" }),
      makeWidget("c", { top: 200, left: 0, tabOrder: "1" }),
    ];

    expect(
      ids(getEntryTabbables({ top: 300, left: 100 }, candidates, true)),
    ).toEqual(["a", "b", "c"]);
  });
});

describe("getTabbableDescendants", () => {
  afterEach(() => {
    document.body.innerHTML = "";
  });

  it("scopes tab order to siblings within the same canvas", () => {
    const canvasA = document.createElement("div");

    canvasA.setAttribute("type", "CANVAS_WIDGET");

    const active = makeWidget("active", { top: 0, left: 0, tabOrder: "2" });
    const siblingInA = makeWidget("siblingInA", {
      top: 100,
      left: 0,
      tabOrder: "3",
    });

    canvasA.append(active, siblingInA);

    const canvasB = document.createElement("div");

    canvasB.setAttribute("type", "CANVAS_WIDGET");

    // lower tab order, but in another canvas: must not win
    const widgetInB = makeWidget("widgetInB", {
      top: 0,
      left: 0,
      tabOrder: "1",
    });

    canvasB.append(widgetInB);
    document.body.append(canvasA, canvasB);

    expect(ids(getTabbableDescendants(active, false))).toEqual(["siblingInA"]);
  });
});
