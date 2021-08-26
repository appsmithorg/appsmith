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
    replayDSL.undo();

    const currentDSL = replayDSL.dsl;
    expect(currentDSL).toStrictEqual({});
  });

  it("checks if undo is reverted on redo", () => {
    replayDSL.redo();

    const currentDSL = replayDSL.dsl;
    expect(currentDSL).toStrictEqual(updatedWidgets);
  });

  it("should not replay if there are no diffs", () => {
    replayDSL.undo();
    const shouldReplay = replayDSL.shouldReplay();

    expect(shouldReplay).toStrictEqual(false);
  });
});
