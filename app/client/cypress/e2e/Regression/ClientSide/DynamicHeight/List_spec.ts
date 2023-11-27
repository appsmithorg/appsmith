import {
  agHelper,
  draggableWidgets,
  locators,
  propPane,
} from "../../../../support/Objects/ObjectsCore";
import EditorNavigation, {
  EntityType,
} from "../../../../support/Pages/EditorNavigation";

describe("Dynamic Height Width validation", function () {
  it("1. Validate change with auto height width for widgets", function () {
    const textMsg = "Dynamic panel validation for text widget wrt height";
    agHelper.AddDsl("dynamicHeightListDsl");

    EditorNavigation.SelectEntityByName("List1", EntityType.Widget);
    agHelper
      .GetWidgetCSSHeight(locators._widgetInDeployed(draggableWidgets.LIST))
      .then((currentListHeight: number) => {
        agHelper.AssertElementAbsence(propPane._propertyPaneHeightLabel);
        EditorNavigation.SelectEntityByName("Text1", EntityType.Widget, {}, [
          "List1",
          "Container1",
        ]);
        agHelper.AssertElementAbsence(propPane._propertyPaneHeightLabel);
        propPane.UpdatePropertyFieldValue("Text", textMsg, true);
        EditorNavigation.SelectEntityByName("Text2", EntityType.Widget);
        agHelper.AssertElementAbsence(propPane._propertyPaneHeightLabel);
        propPane.UpdatePropertyFieldValue("Text", textMsg, true);
        agHelper
          .GetWidgetCSSHeight(locators._widgetInDeployed(draggableWidgets.LIST))
          .then((updatedListHeight: number) => {
            expect(currentListHeight).to.equal(updatedListHeight);
          });
      });
  });
});
