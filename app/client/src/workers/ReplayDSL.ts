import { Doc, Map, UndoManager } from "yjs";
import { captureException } from "@sentry/react";
import { diff as deepDiff, applyChange, revertChange } from "deep-diff";

import { processDiff, DSLDiff, getPathsFromDiff } from "./replayUtils";
import { CanvasWidgetsReduxState } from "reducers/entityReducers/canvasWidgetsReducer";

const _DIFF_ = "diff";

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
   * checks if there is anything to replay or not based on differences between diffs
   *
   * @return boolean
   */
  shouldReplay(isUndo: boolean) {
    const diffs = this.getDiffs();
    const isDiffNotEmpty = diffs && diffs.length > 0;

    if (isUndo) return isDiffNotEmpty;
    else return diffs !== this.prevRedoDiff && isDiffNotEmpty;
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
   * undo the last action. gets diff from yMap and apply that on currentDSL
   *
   * @returns
   */
  undo() {
    const start = performance.now();
    const diffs = this.getDiffs();

    if (this.shouldReplay(true)) {
      this.undoManager.undo();
      const replay = this.applyDiffs(diffs, true);
      const stop = performance.now();

      this.logs.push({
        log: "replay undo",
        undoTime: `${stop - start} ms`,
      });

      return {
        replayWidgetDSL: this.dsl,
        replay,
        logs: this.logs,
        event: "REPLAY_UNDO",
        timeTaken: stop - start,
        paths: getPathsFromDiff(diffs),
      };
    }

    return null;
  }

  /**
   * redo the last action. gets diff from yMap and apply that on currentDSL
   *
   * @returns
   */
  redo() {
    const start = performance.now();
    this.undoManager.redo();
    const diffs = this.getDiffs();

    if (this.shouldReplay(false)) {
      const replay = this.applyDiffs(diffs, false);

      const stop = performance.now();
      this.logs.push({
        log: "replay redo",
        redoTime: `${stop - start} ms`,
      });

      return {
        replayWidgetDSL: this.dsl,
        replay,
        logs: this.logs,
        event: "REPLAY_REDO",
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
  private applyDiffs(diffs: Array<DSLDiff>, isUndo: boolean) {
    const replay = {};
    const applyDSLChange = isUndo ? revertChange : applyChange;
    if (!isUndo) this.prevRedoDiff = diffs;

    for (const diff of diffs) {
      if (!Array.isArray(diff.path) || diff.path.length === 0) {
        continue;
      }
      try {
        processDiff(this.dsl, diff, replay, isUndo);
        applyDSLChange(this.dsl, true, diff);
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
