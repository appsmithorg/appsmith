import * as _ from "../../../../../support/Objects/ObjectsCore";

describe("Table widget one click binding feature", () => {
  it("1.should check that connect data overlay is shown on the table", () => {
    _.entityExplorer.DragDropWidgetNVerify("tablewidgetv2");
    _.agHelper.AssertElementExist(".t--cypress-table-overlay-header");
    _.agHelper.AssertElementExist(".t--cypress-table-overlay-connectdata");
    // should check that tableData one click property control"
    _.propPane.openWidgetPropertyPane("tablewidgetv2");
    _.agHelper.AssertElementExist(".t--one-click-binding-datasource-selector");
  });
});
