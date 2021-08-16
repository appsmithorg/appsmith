import { DataTree } from "entities/DataTree/dataTreeFactory";

export default class ReplayDSL {
  dsl: any = {};
  constructor(dataTree: DataTree) {
    console.log("Replay DSL", { dataTree });
    this.dsl = dataTree;
    //YJS datastructure will be in this.dsl
  }

  undo() {
    console.log(this.dsl);
    return this.dsl;
    // This will return ideally the
    // diff in paths.
    // the paths to update in the canvasWidgets
    // Text1.text = "something"
    // Text1.text = "somet"
    // <WidgetId>.text
  }

  redo() {
    console.log(this.dsl);
    // <WidgetId>.text
  }
}
