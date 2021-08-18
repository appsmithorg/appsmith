import * as Y from "yjs";
import { diff as deepDiff, applyChange, revertChange, Diff } from "deep-diff";
import * as Sentry from "@sentry/react";

import { CanvasWidgetsReduxState } from "reducers/entityReducers/canvasWidgetsReducer";

type DSLDiff = Diff<CanvasWidgetsReduxState, CanvasWidgetsReduxState>;

const _DIFF_ = "diff";

export default class ReplayDSL {
  dsl: CanvasWidgetsReduxState;
  diffMap: any;
  undoManager: Y.UndoManager;

  constructor(widgets: CanvasWidgetsReduxState) {
    const doc = new Y.Doc();
    this.diffMap = doc.get("map", Y.Map);
    this.dsl = widgets;
    this.diffMap.set(_DIFF_, []);
    this.undoManager = new Y.UndoManager(this.diffMap);
  }

  undo() {
    const diffs = this.diffMap.get(_DIFF_);

    if (diffs && diffs.length) {
      this.undoManager.undo();
      this.applyDiffs(diffs, revertChange);
      return this.dsl;
    }

    return null;
  }

  redo() {
    this.undoManager.redo();
    const diffs = this.diffMap.get(_DIFF_);

    if (diffs && diffs.length) {
      this.applyDiffs(diffs, applyChange);
      return this.dsl;
    }

    return null;
  }

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

  private applyDiffs(diffs: Array<DSLDiff>, diffUpdate: typeof applyChange) {
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
