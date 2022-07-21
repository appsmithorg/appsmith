import { diff as deepDiff } from "deep-diff";
import ReplayCanvas from "./ReplayEntity/ReplayCanvas";

describe("Checks ReplayDSL functionality", () => {
  const replayDSL = new ReplayCanvas({});
  const updatedWidgets = {
    "widget-id": {
      widgetName: "Text1",
    },
  };

  it("checks the initialization of the class", () => {
    const currentDiff = replayDSL.getDiffs();
    const currentDSL = replayDSL.entity;

    expect(currentDiff).toStrictEqual([]);
    expect(currentDSL).toStrictEqual({});
  });

  it("checks if dsl is updated on change in widgets", () => {
    replayDSL.update(updatedWidgets);
    const currentDSL = replayDSL.entity;
    const currentDiff = replayDSL.getDiffs();

    expect(currentDSL).toStrictEqual(updatedWidgets);
    expect(currentDiff).toStrictEqual(deepDiff({}, updatedWidgets));
  });

  it("checks if dsl is reverted on undo", () => {
    replayDSL.replay("UNDO");

    const currentDSL = replayDSL.entity;
    expect(currentDSL).toStrictEqual({});
  });

  it("checks if undo is reverted on redo", () => {
    replayDSL.replay("REDO");

    const currentDSL = replayDSL.entity;
    expect(currentDSL).toStrictEqual(updatedWidgets);
  });

  it("should not replay if there are no undo stacks", () => {
    replayDSL.replay("UNDO");
    const shouldReplay = replayDSL.canReplay("UNDO");

    expect(shouldReplay).toStrictEqual(false);
  });
});
