import * as _ from "../../../../../support/Objects/ObjectsCore";
import locators from "../../../../../locators/OneClickBindingLocator";

describe("Table widget one click binding feature", () => {
  it("1.should check that connect data overlay is shown on the table", () => {
    _.entityExplorer.DragDropWidgetNVerify("tablewidgetv2");
    _.agHelper.AssertElementExist(_.table._connectDataHeader);
    _.agHelper.AssertElementExist(_.table._connectDataButton);
    // should check that tableData one click property control"
    _.propPane.openWidgetPropertyPane(_.draggableWidgets.TABLE);
    _.agHelper.AssertElementExist(locators.datasourceDropdownSelector);
  });
});
