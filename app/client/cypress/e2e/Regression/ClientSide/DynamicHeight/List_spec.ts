import {
  entityExplorer,
  locators,
  agHelper,
  propPane,
  draggableWidgets,
} from "../../../../support/Objects/ObjectsCore";

describe("Dynamic Height Width validation", function () {
  it("1. Validate change with auto height width for widgets", function () {
    const textMsg = "Dynamic panel validation for text widget wrt height";
    cy.fixture("dynamicHeightListDsl").then((val) => {
      agHelper.AddDsl(val);
    });
    entityExplorer.SelectEntityByName("List1");
    agHelper
      .GetWidgetCSSHeight(locators._widgetInDeployed(draggableWidgets.LIST))
      .then((currentListHeight: number) => {
        agHelper.AssertElementAbsence(locators._propertyPaneHeightLabel);
        entityExplorer.SelectEntityByName("Container1", "List1");
        entityExplorer.SelectEntityByName("Text1", "Container1");
        agHelper.AssertElementAbsence(locators._propertyPaneHeightLabel);
        propPane.UpdatePropertyFieldValue("Text", textMsg, true);
        entityExplorer.SelectEntityByName("Text2");
        agHelper.AssertElementAbsence(locators._propertyPaneHeightLabel);
        propPane.UpdatePropertyFieldValue("Text", textMsg, true);
        agHelper
          .GetWidgetCSSHeight(locators._widgetInDeployed(draggableWidgets.LIST))
          .then((updatedListHeight: number) => {
            expect(currentListHeight).to.equal(updatedListHeight);
          });
      });
  });
});
