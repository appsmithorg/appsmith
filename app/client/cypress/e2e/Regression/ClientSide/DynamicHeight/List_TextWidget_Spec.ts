import {
  entityExplorer,
  agHelper,
  locators,
  propPane,
  assertHelper,
  draggableWidgets,
} from "../../../../support/Objects/ObjectsCore";

describe("Dynamic Height Width validation list widget", function () {
  it("1. Validate change with auto height width for list widgets", function () {
    const modifierKey = Cypress.platform === "darwin" ? "meta" : "ctrl";
    const textMsg = "Dynamic panel validation for text widget wrt height";
    agHelper.AddDsl("DynamicHeightListTextDsl");

    entityExplorer.DragDropWidgetNVerify("multiselecttreewidget", 300, 500);
    entityExplorer.SelectEntityByName("List1", "Widgets");
    //Widgets which were not possible to be added to list widget cannot be pasted/moved into the list widget with multitreeselect
    entityExplorer.SelectEntityByName("MultiTreeSelect1", "List1");
    agHelper.TypeText(locators._body, `{${modifierKey}}c`, 0, true);
    agHelper.WaitUntilAllToastsDisappear();
    agHelper.Sleep(2000);
    entityExplorer.SelectEntityByName("List1", "Widgets");
    propPane.MoveToTab("Style");
    agHelper.TypeText(locators._body, `{${modifierKey}}v`, 0, true);
    agHelper.ValidateToastMessage(
      "This widget cannot be used inside the list widget.",
      0,
      1,
    );
    agHelper
      .GetWidgetCSSHeight(locators._widgetInDeployed(draggableWidgets.LIST))
      .then((currentListHeight: number) => {
        //Widgets within list widget have no dynamic height
        agHelper.AssertElementAbsence(propPane._propertyPaneHeightLabel);
        //Widgets within list widget in existing applications have no dynamic height
        entityExplorer.SelectEntityByName("Container1", "List1");
        entityExplorer.SelectEntityByName("Text1", "Container1");

        agHelper.AssertElementAbsence(propPane._propertyPaneHeightLabel);
        propPane.UpdatePropertyFieldValue("Text", textMsg, true);
        entityExplorer.SelectEntityByName("Container1", "List1");
        entityExplorer.SelectEntityByName("Text2", "Container1");
        agHelper.AssertElementAbsence(propPane._propertyPaneHeightLabel);
        propPane.UpdatePropertyFieldValue("Text", textMsg, true);
        agHelper
          .GetWidgetCSSHeight(locators._widgetInDeployed(draggableWidgets.LIST))
          .then((updatedListHeight: number) => {
            expect(currentListHeight).to.equal(updatedListHeight);
          });
        entityExplorer.SelectEntityByName("Container1", "List1");

        agHelper.AssertElementAbsence(propPane._propertyPaneHeightLabel);
        //Widgets when moved into the list widget have no dynamic height
        entityExplorer.SelectEntityByName("Text3", "Widgets");
        propPane.MoveToTab("Style");
        agHelper.TypeText(locators._body, `{${modifierKey}}c`, 0, true);
        entityExplorer.SelectEntityByName("List1", "Widgets");
        propPane.MoveToTab("Style");
        agHelper.TypeText(locators._body, `{${modifierKey}}v`, 0, true);
        assertHelper.AssertNetworkStatus("@updateLayout", 200);
        entityExplorer.NavigateToSwitcher("Explorer");
        entityExplorer.SelectEntityByName("Text3Copy");
        agHelper.AssertElementAbsence(propPane._propertyPaneHeightLabel);
        agHelper.TypeText(locators._body, `{${modifierKey}}c`, 0, true);
        //agHelper.GetElement(locators._body).click({ force: true });
        agHelper.GetElement(locators._canvasBody).click({ force: true });
        agHelper.TypeText(locators._body, `{${modifierKey}}v`, 0, true);
        assertHelper.AssertNetworkStatus("@updateLayout");
        //Widgets when moved out of the list widget have dynamic height in property pane
        entityExplorer.SelectEntityByName("Text3CopyCopy", "Widgets");
        agHelper.AssertElementVisible(propPane._propertyPaneHeightLabel);
        agHelper.GetNClick(locators._widgetInDeployed(draggableWidgets.TEXT));
        agHelper
          .GetWidgetCSSHeight(locators._widgetInDeployed(draggableWidgets.TEXT))
          .then((height: number) => {
            propPane.SelectPropertiesDropDown("height", "Auto Height");
            assertHelper.AssertNetworkStatus("@updateLayout", 200);
            agHelper.GetNClick(
              locators._widgetInDeployed(draggableWidgets.TEXT),
            );
            agHelper
              .GetWidgetCSSHeight(
                locators._widgetInDeployed(draggableWidgets.TEXT),
              )
              .wait(1000)
              .then((updatedListHeight: number) => {
                expect(height).to.not.equal(updatedListHeight);
              });
          });
        entityExplorer.SelectEntityByName("Text3CopyCopy", "Widgets");
        agHelper.TypeText(locators._body, `{${modifierKey}}c`, 0, true);
        entityExplorer.SelectEntityByName("List1", "Widgets");
        propPane.MoveToTab("Style");
        agHelper.TypeText(locators._body, `{${modifierKey}}v`, 0, true);
        assertHelper.AssertNetworkStatus("@updateLayout", 200);
        //Widgets when copied and pasted into the list widget no longer have dynamic height
        entityExplorer.SelectEntityByName("Text3CopyCopyCopy", "Container1");
        agHelper.AssertElementAbsence(propPane._propertyPaneHeightLabel);
        entityExplorer.SelectEntityByName("Text3CopyCopy");
        agHelper.TypeText(locators._body, `{${modifierKey}}x`, 0, true);
        entityExplorer.SelectEntityByName("List1");
        propPane.MoveToTab("Style");
        agHelper.Sleep(500);
        agHelper.TypeText(locators._body, `{${modifierKey}}v`, 0, true);
        assertHelper.AssertNetworkStatus("@updateLayout", 200);
        entityExplorer.SelectEntityByName("Text3CopyCopy", "Widgets");
        agHelper.AssertElementAbsence(propPane._propertyPaneHeightLabel);
      });
  });
});
