import { CanvasWidgetsReduxState } from "reducers/entityReducers/canvasWidgetsReducer";
import * as Y from "yjs";
import { isEqual } from "lodash";

export default class ReplayDSL {
  dslMap: any;
  undoManager: Y.UndoManager;

  constructor(widgets: CanvasWidgetsReduxState) {
    const doc = new Y.Doc();
    this.dslMap = doc.get("map", Y.Map);
    this.dslMap.set("dsl", widgets);
    this.undoManager = new Y.UndoManager(this.dslMap);
    this.undoManager.on("stack-item-added", (stackItem: any) => {
      console.log("added", stackItem);
    });
    this.undoManager.on("stack-item-popped", (stackItem: any) => {
      console.log("popped", stackItem);
    });
  }

  undo() {
    this.undoManager.undo();
    return this.dslMap.get("dsl");
  }

  redo() {
    this.undoManager.redo();
    return this.dslMap.get("dsl");
  }

  update(widgets: CanvasWidgetsReduxState) {
    const prevWidgets = this.dslMap.get("dsl", widgets);
    const startTime = performance.now();
    const isequal = isEqual(prevWidgets, widgets);
    const endTime = performance.now();
    console.log("replay updating,", isequal, endTime - startTime, "ms");
    if (!isequal) this.dslMap.set("dsl", widgets);
  }
}
