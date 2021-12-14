import ReplayDSL from "./ReplayDSL";
import { diff as deepDiff } from "deep-diff";

describe("Checks ReplayDSL functionality", () => {
  const replayDSL = new ReplayDSL({});
  const updatedWidgets = {
    "widget-id": {
      widgetName: "Text1",
    },
  };

  it("checks the initialization of the class", () => {
    const currentDiff = replayDSL.getDiffs();
    const currentDSL = replayDSL.dsl;

    expect(currentDiff).toStrictEqual([]);
    expect(currentDSL).toStrictEqual({});
  });

  it("checks if dsl is updated on change in widgets", () => {
    replayDSL.update(updatedWidgets);
    const currentDSL = replayDSL.dsl;
    const currentDiff = replayDSL.getDiffs();

    expect(currentDSL).toStrictEqual(updatedWidgets);
    expect(currentDiff).toStrictEqual(deepDiff({}, updatedWidgets));
  });

  it("checks if dsl is reverted on undo", () => {
    replayDSL.replay("UNDO");

    const currentDSL = replayDSL.dsl;
    expect(currentDSL).toStrictEqual({});
  });

  it("checks if undo is reverted on redo", () => {
    replayDSL.replay("REDO");

    const currentDSL = replayDSL.dsl;
    expect(currentDSL).toStrictEqual(updatedWidgets);
  });

  it("should not replay if there are no undo stacks", () => {
    replayDSL.replay("UNDO");
    const shouldReplay = replayDSL.canReplay("UNDO");

    expect(shouldReplay).toStrictEqual(false);
  });
});
