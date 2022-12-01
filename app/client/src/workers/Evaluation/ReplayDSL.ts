import { Doc, Map, UndoManager } from "yjs";
import { captureException } from "@sentry/react";
import { diff as deepDiff, applyChange, revertChange } from "deep-diff";

import { processDiff, DSLDiff, getPathsFromDiff } from "./replayUtils";
import { CanvasWidgetsReduxState } from "reducers/entityReducers/canvasWidgetsReducer";

const _DIFF_ = "diff";
type ReplayType = "UNDO" | "REDO";

export default class ReplayDSL {
  private diffMap: any;
  private undoManager: UndoManager;
  private dsl: CanvasWidgetsReduxState;
  private prevRedoDiff: Array<DSLDiff> | undefined;
  logs: any[] = [];

  constructor(widgets: CanvasWidgetsReduxState) {
    const doc = new Doc();
    this.diffMap = doc.get("map", Map);
    this.dsl = widgets;
    this.diffMap.set(_DIFF_, []);
    this.undoManager = new UndoManager(this.diffMap, { captureTimeout: 100 });
  }

  /**
   * checks if there is anything in the redoStack or undoStack
   *
   * @return boolean
   */
  canReplay(replayType: ReplayType) {
    switch (replayType) {
      case "UNDO":
        return this.undoManager.undoStack.length > 0;
      case "REDO":
        return this.undoManager.redoStack.length > 0;
      default:
        return false;
    }
  }

  /**
   * get the diffs from yMap
   *
   * @returns
   */
  private getDiffs() {
    return this.diffMap.get(_DIFF_);
  }

  /**
   * replay actions ( undo redo )
   *
   * Note:
   * important thing to note is that for redo we redo first, then
   * get the diff map and undo, we get diff first, then undo
   *
   * @param replayType
   */
  replay(replayType: ReplayType) {
    const start = performance.now();

    if (this.canReplay(replayType)) {
      let diffs;

      switch (replayType) {
        case "UNDO":
          diffs = this.getDiffs();
          this.undoManager.undo();
          break;
        case "REDO":
          this.undoManager.redo();
          diffs = this.getDiffs();
          break;
      }

      const replay = this.applyDiffs(diffs, replayType);
      const stop = performance.now();

      this.logs.push({
        log: `replay ${replayType}`,
        undoTime: `${stop - start} ms`,
        replay: replay,
        diffs: diffs,
      });

      return {
        replayWidgetDSL: this.dsl,
        replay,
        logs: this.logs,
        event: `REPLAY_${replayType}`,
        timeTaken: stop - start,
        paths: getPathsFromDiff(diffs),
      };
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
    this.logs.push({
      log: "replay updating",
      updateTime: `${endTime - startTime} ms`,
    });
  }

  clearLogs() {
    this.logs = [];
  }

  /**
   * apply the diff on the current dsl
   *
   * @param diffs
   * @param isUndo
   */
  applyDiffs(diffs: Array<DSLDiff>, replayType: ReplayType) {
    const replay = {};
    const isUndo = replayType === "UNDO";
    const applyDiff = isUndo ? revertChange : applyChange;

    for (const diff of diffs) {
      if (!Array.isArray(diff.path) || diff.path.length === 0) {
        continue;
      }
      try {
        processDiff(this.dsl, diff, replay, isUndo);
        applyDiff(this.dsl, true, diff);
      } catch (e) {
        captureException(e, {
          extra: {
            diff,
            updateLength: diffs.length,
          },
        });
      }
    }

    return replay;
  }
}
