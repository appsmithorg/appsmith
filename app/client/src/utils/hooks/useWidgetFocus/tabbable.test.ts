import { TAB_ORDER_ATTRIBUTE } from "utils/widgetTabOrder";
import { handleTab } from "./handleTab";
import {
  getExplicitTabOrder,
  getNextTabbableDescendant,
  getTabbableDescendants,
  sortTabbableWidgets,
  sortWidgetsByPosition,
} from "./tabbable";

interface Rect {
  top: number;
  left: number;
  width?: number;
  height?: number;
}

function mockRect(element: HTMLElement, rect: Rect) {
  const { height = 40, left, top, width = 100 } = rect;

  element.getBoundingClientRect = () =>
    ({
      top,
      left,
      bottom: top + height,
      right: left + width,
      width,
      height,
      x: left,
      y: top,
      toJSON: () => ({}),
    }) as DOMRect;
}

function createCanvas(
  parent: HTMLElement = document.body,
  rect: Rect = { top: 0, left: 0, width: 1000, height: 1000 },
) {
  const canvas = document.createElement("div");

  canvas.setAttribute("type", "CANVAS_WIDGET");
  mockRect(canvas, rect);
  parent.appendChild(canvas);

  return canvas;
}

function createWidget(
  parent: HTMLElement,
  rect: Rect,
  options: {
    tabOrder?: string;
    widgetClass?: string;
    withInput?: boolean;
  } = {},
) {
  const {
    tabOrder,
    widgetClass = "t--widget-inputwidgetv2",
    withInput = true,
  } = options;
  const widget = document.createElement("div");

  widget.className = `positioned-widget ${widgetClass}`;
  mockRect(widget, rect);

  if (tabOrder !== undefined) {
    widget.setAttribute(TAB_ORDER_ATTRIBUTE, tabOrder);
  }

  if (withInput) {
    const input = document.createElement("input");

    widget.appendChild(input);
  }

  parent.appendChild(widget);

  return widget;
}

function inputOf(widget: HTMLElement): HTMLInputElement {
  return widget.querySelector("input") as HTMLInputElement;
}

afterEach(() => {
  document.body.innerHTML = "";
});

describe("getNextTabbableDescendant", () => {
  it("should return undefined if no descendants are passed", () => {
    expect(getNextTabbableDescendant([])).toBeUndefined();
  });
});

describe("getExplicitTabOrder", () => {
  it("reads valid explicit values, 1 being the earliest", () => {
    const widget = createWidget(document.body, { top: 10, left: 10 });

    widget.setAttribute(TAB_ORDER_ATTRIBUTE, "1");
    expect(getExplicitTabOrder(widget)).toBe(1);

    widget.setAttribute(TAB_ORDER_ATTRIBUTE, "3");
    expect(getExplicitTabOrder(widget)).toBe(3);
  });

  it("treats missing, blank and invalid values as Auto", () => {
    const widget = createWidget(document.body, { top: 10, left: 10 });

    expect(getExplicitTabOrder(widget)).toBeUndefined();

    for (const value of [
      "",
      "  ",
      "0",
      "-1",
      "1.5",
      "abc",
      "NaN",
      "Infinity",
    ]) {
      widget.setAttribute(TAB_ORDER_ATTRIBUTE, value);
      expect(getExplicitTabOrder(widget)).toBeUndefined();
    }
  });
});

describe("sortTabbableWidgets", () => {
  const origin = { top: 0, left: 0 };

  it("preserves the current position-based order when all widgets are Auto", () => {
    const w1 = createWidget(document.body, { top: 10, left: 10 });
    const w2 = createWidget(document.body, { top: 10, left: 200 });
    const w3 = createWidget(document.body, { top: 100, left: 10 });

    const result = sortTabbableWidgets(origin, [w1, w2, w3]);

    expect(result).toEqual(sortWidgetsByPosition(origin, [w1, w2, w3]));
    expect(result).toEqual([w1, w2, w3]);
  });

  it("treats blank attribute values as Auto and keeps position order", () => {
    const w1 = createWidget(
      document.body,
      { top: 10, left: 10 },
      {
        tabOrder: "",
      },
    );
    const w2 = createWidget(
      document.body,
      { top: 10, left: 200 },
      {
        tabOrder: "   ",
      },
    );

    expect(sortTabbableWidgets(origin, [w1, w2])).toEqual(
      sortWidgetsByPosition(origin, [w1, w2]),
    );
  });

  it("ignores invalid values and keeps position order when no valid value exists", () => {
    const w1 = createWidget(
      document.body,
      { top: 10, left: 10 },
      {
        tabOrder: "abc",
      },
    );
    const w2 = createWidget(
      document.body,
      { top: 10, left: 200 },
      {
        tabOrder: "-1",
      },
    );
    const w3 = createWidget(
      document.body,
      { top: 100, left: 10 },
      {
        tabOrder: "1.5",
      },
    );

    expect(sortTabbableWidgets(origin, [w1, w2, w3])).toEqual(
      sortWidgetsByPosition(origin, [w1, w2, w3]),
    );
  });

  it("sorts explicitly ordered widgets first, 1 before 2, before Auto widgets", () => {
    const w1 = createWidget(
      document.body,
      { top: 10, left: 10 },
      {
        tabOrder: "2",
      },
    );
    const w2 = createWidget(
      document.body,
      { top: 10, left: 200 },
      {
        tabOrder: "1",
      },
    );
    const w3 = createWidget(document.body, { top: 100, left: 10 });

    expect(sortTabbableWidgets(origin, [w1, w2, w3])).toEqual([w2, w1, w3]);
  });

  it("treats invalid values as Auto when at least one valid value exists", () => {
    const w1 = createWidget(
      document.body,
      { top: 10, left: 10 },
      {
        tabOrder: "abc",
      },
    );
    const w2 = createWidget(
      document.body,
      { top: 100, left: 10 },
      {
        tabOrder: "2",
      },
    );
    const w3 = createWidget(
      document.body,
      { top: 50, left: 10 },
      {
        tabOrder: "-2",
      },
    );

    // invalid widgets keep their automatic position order after the explicit one
    expect(sortTabbableWidgets(origin, [w1, w2, w3])).toEqual([w2, w1, w3]);
  });

  it("tie-breaks duplicate explicit values using position order", () => {
    const w1 = createWidget(
      document.body,
      { top: 10, left: 10 },
      {
        tabOrder: "2",
      },
    );
    const w2 = createWidget(
      document.body,
      { top: 10, left: 200 },
      {
        tabOrder: "2",
      },
    );
    const w3 = createWidget(
      document.body,
      { top: 100, left: 10 },
      {
        tabOrder: "1",
      },
    );

    expect(sortTabbableWidgets(origin, [w1, w2, w3])).toEqual([w3, w1, w2]);
  });

  it("reverses the same final sequence for Shift+Tab", () => {
    const w1 = createWidget(
      document.body,
      { top: 10, left: 10 },
      {
        tabOrder: "2",
      },
    );
    const w2 = createWidget(
      document.body,
      { top: 10, left: 200 },
      {
        tabOrder: "1",
      },
    );
    const w3 = createWidget(document.body, { top: 100, left: 10 });

    expect(sortTabbableWidgets(origin, [w1, w2, w3], true)).toEqual([
      w3,
      w1,
      w2,
    ]);
  });

  it("returns the widgets after the current widget in the sequence", () => {
    const current = createWidget(
      document.body,
      { top: 10, left: 10 },
      {
        tabOrder: "1",
      },
    );
    const w2 = createWidget(
      document.body,
      { top: 10, left: 200 },
      {
        tabOrder: "2",
      },
    );
    const w3 = createWidget(document.body, { top: 100, left: 10 });

    expect(sortTabbableWidgets(origin, [w2, w3], false, current)).toEqual([
      w2,
      w3,
    ]);
    expect(sortTabbableWidgets(origin, [w2, w3], true, current)).toEqual([]);
  });
});

describe("getTabbableDescendants: sibling scope", () => {
  it("keeps the current position-based behavior when all widgets are Auto", () => {
    const canvas = createCanvas();
    const w1 = createWidget(canvas, { top: 10, left: 10 });
    const w2 = createWidget(canvas, { top: 10, left: 200 });
    const w3 = createWidget(canvas, { top: 100, left: 10 });

    expect(getTabbableDescendants(inputOf(w1))).toEqual([w2, w3]);
    expect(getTabbableDescendants(inputOf(w3), true)).toEqual([w2, w1]);
  });

  it("explicit order overrides position order", () => {
    const canvas = createCanvas();
    const w1 = createWidget(canvas, { top: 10, left: 10 }, { tabOrder: "2" });
    const w2 = createWidget(canvas, { top: 10, left: 200 }, { tabOrder: "1" });
    const w3 = createWidget(canvas, { top: 100, left: 10 });

    // final sequence is [w2, w1, w3]
    expect(getTabbableDescendants(inputOf(w2))).toEqual([w1, w3]);
    expect(getTabbableDescendants(inputOf(w1))).toEqual([w3]);
  });

  it("an explicitly ordered widget above/left of the current one can be next", () => {
    const canvas = createCanvas();
    const current = createWidget(
      canvas,
      { top: 200, left: 10 },
      {
        tabOrder: "1",
      },
    );
    const above = createWidget(
      canvas,
      { top: 10, left: 10 },
      {
        tabOrder: "2",
      },
    );

    expect(getTabbableDescendants(inputOf(current))).toEqual([above]);
  });

  it("reverses the same sequence for Shift+Tab", () => {
    const canvas = createCanvas();
    const w1 = createWidget(canvas, { top: 10, left: 10 }, { tabOrder: "2" });
    const w2 = createWidget(canvas, { top: 10, left: 200 }, { tabOrder: "1" });
    const w3 = createWidget(canvas, { top: 100, left: 10 });

    // final sequence is [w2, w1, w3]
    expect(getTabbableDescendants(inputOf(w3), true)).toEqual([w1, w2]);
  });
});

describe("getTabbableDescendants: canvas scope", () => {
  it("returns the full explicit sequence when tabbing from the canvas", () => {
    const canvas = createCanvas();
    const w1 = createWidget(canvas, { top: 10, left: 10 }, { tabOrder: "2" });
    const w2 = createWidget(canvas, { top: 10, left: 200 }, { tabOrder: "1" });
    const w3 = createWidget(canvas, { top: 100, left: 10 });

    expect(getTabbableDescendants(canvas)).toEqual([w2, w1, w3]);
    expect(getTabbableDescendants(canvas, true)).toEqual([w3, w1, w2]);
  });

  it("keeps the position-based order from the canvas when all widgets are Auto", () => {
    const canvas = createCanvas();
    const w1 = createWidget(canvas, { top: 10, left: 10 });
    const w2 = createWidget(canvas, { top: 10, left: 200 });
    const w3 = createWidget(canvas, { top: 100, left: 10 });

    expect(getTabbableDescendants(canvas)).toEqual([w1, w2, w3]);
  });
});

describe("getTabbableDescendants: modal scope", () => {
  function createModal() {
    const modal = document.createElement("div");

    modal.className = "t--modal-widget";
    mockRect(modal, { top: 0, left: 0, width: 600, height: 600 });
    document.body.appendChild(modal);

    const trigger = document.createElement("div");

    modal.appendChild(trigger);

    return { modal, trigger };
  }

  it("keeps the position-based order when all modal widgets are Auto", () => {
    const { trigger } = createModal();
    const m1 = createWidget(trigger.parentElement as HTMLElement, {
      top: 10,
      left: 10,
    });
    const m2 = createWidget(trigger.parentElement as HTMLElement, {
      top: 110,
      left: 10,
    });

    expect(getTabbableDescendants(trigger)).toEqual([m1, m2]);
    expect(getTabbableDescendants(trigger, true)).toEqual([m2, m1]);
  });

  it("uses the explicit sequence inside the modal scope", () => {
    const { modal, trigger } = createModal();
    const m1 = createWidget(modal, { top: 10, left: 10 });
    const m2 = createWidget(modal, { top: 110, left: 10 }, { tabOrder: "1" });

    expect(getTabbableDescendants(trigger)).toEqual([m2, m1]);
    expect(getTabbableDescendants(trigger, true)).toEqual([m1, m2]);
  });
});

describe("getTabbableDescendants: nested container scope", () => {
  it("applies the explicit order only within the inner scope", () => {
    const outerCanvas = createCanvas();
    const container = createWidget(
      outerCanvas,
      { top: 10, left: 10, width: 500, height: 500 },
      { widgetClass: "t--widget-containerwidget", withInput: false },
    );
    const innerCanvas = createCanvas(container, {
      top: 10,
      left: 10,
      width: 480,
      height: 480,
    });
    const in1 = createWidget(innerCanvas, { top: 20, left: 20 });
    const in2 = createWidget(
      innerCanvas,
      { top: 120, left: 20 },
      {
        tabOrder: "2",
      },
    );
    const in3 = createWidget(
      innerCanvas,
      { top: 220, left: 20 },
      {
        tabOrder: "1",
      },
    );

    // inner sequence is [in3, in2, in1]
    expect(getTabbableDescendants(inputOf(in2))).toEqual([in1]);
    expect(getTabbableDescendants(inputOf(in2), true)).toEqual([in3]);
  });
});

describe("getNextTabbableDescendant: container entry", () => {
  it("enters a container at the lowest explicit tab order", () => {
    const canvas = createCanvas();
    const container = createWidget(
      canvas,
      { top: 10, left: 10, width: 500, height: 500 },
      { widgetClass: "t--widget-containerwidget", withInput: false },
    );
    const innerCanvas = createCanvas(container, {
      top: 10,
      left: 10,
      width: 480,
      height: 480,
    });
    const in1 = createWidget(innerCanvas, { top: 20, left: 20 });
    const in2 = createWidget(
      innerCanvas,
      { top: 120, left: 20 },
      {
        tabOrder: "1",
      },
    );

    expect(getNextTabbableDescendant([container])).toBe(in2);
    expect(getNextTabbableDescendant([container], true)).toBe(in1);
  });

  it("enters a container by position when all children are Auto", () => {
    const canvas = createCanvas();
    const container = createWidget(
      canvas,
      { top: 10, left: 10, width: 500, height: 500 },
      { widgetClass: "t--widget-containerwidget", withInput: false },
    );
    const innerCanvas = createCanvas(container, {
      top: 10,
      left: 10,
      width: 480,
      height: 480,
    });
    const in1 = createWidget(innerCanvas, { top: 20, left: 20 });

    createWidget(innerCanvas, { top: 120, left: 20 });

    expect(getNextTabbableDescendant([container])).toBe(in1);
  });
});

// Regression guard for the end-to-end seam: with three widgets whose explicit
// tab order disagrees with their visual position, the tab sequence must follow
// tabOrder, not position. Two widgets cannot catch this — a 2-cycle ping-pongs
// the same either way — so the discriminating case needs three. Mirrors the
// behavior verified live on a deployed app: orders 1 -> 2 -> 3 mapped onto
// top/mid/bottom widgets, the keyboard sequence walked top -> bottom -> mid.
describe("getTabbableDescendants: explicit order overrides position (3 widgets)", () => {
  it("walks tabOrder, not visual position, forward and in reverse", () => {
    const canvas = createCanvas();
    // visual order top -> bottom: top, mid, bottom
    // explicit tab order:          top=1, mid=3, bottom=2
    // => full sequence is top -> bottom -> mid
    const top = createWidget(canvas, { top: 10, left: 10 }, { tabOrder: "1" });
    const mid = createWidget(canvas, { top: 110, left: 10 }, { tabOrder: "3" });
    const bottom = createWidget(
      canvas,
      { top: 210, left: 10 },
      { tabOrder: "2" },
    );

    // from top (order 1): next is bottom (order 2) — NOT mid, the next by position
    expect(getTabbableDescendants(inputOf(top))).toEqual([bottom, mid]);
    // from bottom (order 2): next is mid (order 3)
    expect(getTabbableDescendants(inputOf(bottom))).toEqual([mid]);
    // Shift+Tab from mid (last): predecessors in reverse — bottom, then top
    expect(getTabbableDescendants(inputOf(mid), true)).toEqual([bottom, top]);
  });
});

// Wrap-around regression suite (reported bug: forward tab got stuck on the
// last numbered widget while backward wrapped fine). The culprit: a trailing
// non-focusable widget (image/chart/divider) kept the sibling list non-empty
// but unfocusable, so handleTab preventDefault-ed without moving focus and
// the parent-scope wrap was never reached.
describe("handleTab: wrap-around", () => {
  function createTabEvent(target: HTMLElement, shiftKey = false) {
    return {
      target,
      shiftKey,
      preventDefault: jest.fn(),
    } as unknown as KeyboardEvent;
  }

  it("wraps forward from the last numbered widget to the first", () => {
    const canvas = createCanvas();
    const w1 = createWidget(canvas, { top: 10, left: 10 }, { tabOrder: "1" });
    const w2 = createWidget(canvas, { top: 110, left: 10 }, { tabOrder: "2" });

    inputOf(w2).focus();

    const event = createTabEvent(inputOf(w2));

    handleTab(event);

    expect(event.preventDefault).toHaveBeenCalled();
    expect(document.activeElement).toBe(inputOf(w1));
  });

  it("wraps forward past a trailing non-focusable widget (reported bug)", () => {
    const canvas = createCanvas();
    const w1 = createWidget(canvas, { top: 10, left: 10 }, { tabOrder: "1" });
    const w2 = createWidget(canvas, { top: 110, left: 10 }, { tabOrder: "2" });

    // display-only widget below the numbered ones, nothing focusable inside
    createWidget(
      canvas,
      { top: 210, left: 10 },
      { widgetClass: "t--widget-imagewidget", withInput: false },
    );

    inputOf(w2).focus();

    const event = createTabEvent(inputOf(w2));

    handleTab(event);

    expect(event.preventDefault).toHaveBeenCalled();
    expect(document.activeElement).toBe(inputOf(w1));
  });

  it("wraps backward from the first numbered widget to the last", () => {
    const canvas = createCanvas();
    const w1 = createWidget(canvas, { top: 10, left: 10 }, { tabOrder: "1" });
    const w2 = createWidget(canvas, { top: 110, left: 10 }, { tabOrder: "2" });

    createWidget(
      canvas,
      { top: 210, left: 10 },
      { widgetClass: "t--widget-imagewidget", withInput: false },
    );

    inputOf(w1).focus();

    const event = createTabEvent(inputOf(w1), true);

    handleTab(event);

    expect(event.preventDefault).toHaveBeenCalled();
    expect(document.activeElement).toBe(inputOf(w2));
  });

  it("cycles the full explicit sequence forward: 1 -> 2 -> 3 -> 1", () => {
    const canvas = createCanvas();
    const w1 = createWidget(canvas, { top: 10, left: 10 }, { tabOrder: "1" });
    const w2 = createWidget(canvas, { top: 110, left: 10 }, { tabOrder: "2" });
    const w3 = createWidget(canvas, { top: 210, left: 10 }, { tabOrder: "3" });

    inputOf(w1).focus();

    for (const expected of [w2, w3, w1]) {
      const event = createTabEvent(document.activeElement as HTMLElement);

      handleTab(event);
      expect(document.activeElement).toBe(inputOf(expected));
    }
  });

  it("self-cycles when the current widget is the only focusable one", () => {
    const canvas = createCanvas();
    const w1 = createWidget(canvas, { top: 10, left: 10 }, { tabOrder: "1" });

    // only sibling is non-focusable, so the wrap target is the widget itself
    createWidget(
      canvas,
      { top: 110, left: 10 },
      { widgetClass: "t--widget-imagewidget", withInput: false },
    );

    inputOf(w1).focus();

    const event = createTabEvent(inputOf(w1));

    handleTab(event);

    // focus is never left stuck in limbo: the cycle of one wraps to itself
    expect(document.activeElement).toBe(inputOf(w1));
  });
});
