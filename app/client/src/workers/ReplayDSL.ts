import * as Y from "yjs";
import * as Sentry from "@sentry/react";
import { diff as deepDiff, applyChange, revertChange, Diff } from "deep-diff";

import { CanvasWidgetsReduxState } from "reducers/entityReducers/canvasWidgetsReducer";

const _DIFF_ = "diff";
type DSLDiff = Diff<CanvasWidgetsReduxState, CanvasWidgetsReduxState>;

export default class ReplayDSL {
  diffMap: any;
  undoManager: Y.UndoManager;
  dsl: CanvasWidgetsReduxState;

  constructor(widgets: CanvasWidgetsReduxState) {
    const doc = new Y.Doc();
    this.diffMap = doc.get("map", Y.Map);
    this.dsl = widgets;
    this.diffMap.set(_DIFF_, []);
    this.undoManager = new Y.UndoManager(this.diffMap);
  }

  /**
   * checks if there is anything to replay or not based on differences between diffs
   *
   * @return boolean
   */
  shouldReplay() {
    const diffs = this.getDiffs();

    return diffs && diffs.length;
  }

  /**
   * get the diffs from yMap
   *
   * @returns
   */
  getDiffs() {
    return this.diffMap.get(_DIFF_);
  }

  /**
   * undo the last action. gets diff from yMap and apply that on currentDSL
   *
   * @returns
   */
  undo() {
    const diffs = this.getDiffs();

    if (this.shouldReplay()) {
      this.undoManager.undo();
      this.applyDiffs(diffs, revertChange);

      console.log({ dsl: this.dsl });
      return this.dsl;
    }

    return null;
  }

  /**
   * redo the last action. gets diff from yMap and apply that on currentDSL
   *
   * @returns
   */
  redo() {
    this.undoManager.redo();
    const diffs = this.getDiffs();

    if (this.shouldReplay()) {
      this.applyDiffs(diffs, applyChange);
      return this.dsl;
    }

    return null;
  }

  /**
   * saves the changes (diff) in yMap
   * only if there is a deep diff
   *
   * @param widgets
   */
  update(widgets: CanvasWidgetsReduxState) {
    const startTime = performance.now();
    const diffs = deepDiff(this.dsl, widgets);
    if (diffs && diffs.length) {
      this.dsl = widgets;
      this.diffMap.set(_DIFF_, diffs);
    }
    const endTime = performance.now();
    console.log("replay updating,", diffs, endTime - startTime, "ms");
  }

  /**
   * apply the diff on the current dsl
   *
   * @param diffs
   * @param diffUpdate
   */
  applyDiffs(diffs: Array<DSLDiff>, diffUpdate: typeof applyChange) {
    for (const diff of diffs) {
      if (!Array.isArray(diff.path) || diff.path.length === 0) {
        continue;
      }
      try {
        diffUpdate(this.dsl, true, diff);
      } catch (e) {
        Sentry.captureException(e, {
          extra: {
            diff,
            updateLength: diffs.length,
          },
        });
      }
    }
  }
}
