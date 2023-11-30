import oneClickBindingLocator from "../../../../../locators/OneClickBindingLocator";
import * as _ from "../../../../../support/Objects/ObjectsCore";
import EditorNavigation, {
  EntityType,
} from "../../../../../support/Pages/EditorNavigation";

describe("Table widget one click binding feature", () => {
  it("1.should check that connect data overlay is shown on the table", () => {
    _.entityExplorer.DragDropWidgetNVerify(_.draggableWidgets.TABLE);
    _.agHelper.AssertElementExist(_.table._connectDataHeader);
    _.agHelper.AssertElementExist(_.table._connectDataButton);
    // should check that tableData one click property control"
    EditorNavigation.SelectEntityByName("Table1", EntityType.Widget);

    _.agHelper.AssertElementExist(
      oneClickBindingLocator.datasourceDropdownSelector,
    );
  });
});
