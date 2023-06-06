import oneClickBindingLocator from "../../../../../locators/OneClickBindingLocator";
import * as _ from "../../../../../support/Objects/ObjectsCore";

describe("Table widget one click binding feature", () => {
  it("1.should check that connect data overlay is shown on the table", () => {
    _.entityExplorer.DragDropWidgetNVerify(_.draggableWidgets.TABLE);
    _.agHelper.AssertElementExist(_.table._connectDataHeader);
    _.agHelper.AssertElementExist(_.table._connectDataButton);
    // should check that tableData one click property control"
    _.entityExplorer.SelectEntityByName("Table1", "Widgets");

    _.agHelper.AssertElementExist(
      oneClickBindingLocator.datasourceDropdownSelector,
    );
  });
});
