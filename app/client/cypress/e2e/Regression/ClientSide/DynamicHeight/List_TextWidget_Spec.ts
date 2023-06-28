import {
  entityExplorer,
  agHelper,
  locators,
  propPane,
  assertHelper,
} from "../../../../support/Objects/ObjectsCore";

describe("Dynamic Height Width validation list widget", function () {
  it("1. Validate change with auto height width for list widgets", function () {
    const modifierKey = Cypress.platform === "darwin" ? "meta" : "ctrl";
    const textMsg = "Dynamic panel validation for text widget wrt height";
    cy.fixture("DynamicHeightListTextDsl").then((val) => {
      agHelper.AddDsl(val);
    });
    entityExplorer.DragDropWidgetNVerify("multiselecttreewidget", 300, 500);
    entityExplorer.SelectEntityByName("List1", "Widgets");
    //Widgets which were not possible to be added to list widget cannot be pasted/moved into the list widget with multitreeselect
    entityExplorer.SelectEntityByName("MultiTreeSelect1", "List1");
    agHelper.TypeText(locators._body, `{${modifierKey}}c`, 0, true);

    // agHelper.AssertElementAbsence(locators._toastBody);
    entityExplorer.SelectEntityByName("List1", "Widgets");
    propPane.MoveToTab("Style");
    agHelper.TypeText(locators._body, `{${modifierKey}}v`, 0, true);

    assertHelper.AssertNetworkStatus("@updateLayout");
    agHelper.GetNAssertContains(
      locators._toastBody,
      "This widget cannot be used inside the list widget.",
    );
    agHelper
      .GetWidgetCSSHeight(locators._widgetInDeployed("listwidget"))
      .then((currentListHeight: number) => {
        //Widgets within list widget have no dynamic height
        agHelper.AssertElementAbsence(locators._propertyPaneHeightLabel);
        //Widgets within list widget in existing applications have no dynamic height
        entityExplorer.SelectEntityByName("Container1", "List1");
        entityExplorer.SelectEntityByName("Text1", "Container1");

        agHelper.AssertElementAbsence(locators._propertyPaneHeightLabel);
        propPane.TypeTextIntoField("text", textMsg, true);
        entityExplorer.SelectEntityByName("Container1", "List1");
        entityExplorer.SelectEntityByName("Text2", "Container1");
        agHelper.AssertElementAbsence(locators._propertyPaneHeightLabel);
        propPane.TypeTextIntoField("text", textMsg, true);
        agHelper
          .GetWidgetCSSHeight(locators._widgetInDeployed("listwidget"))
          .then((updatedListHeight: number) => {
            expect(currentListHeight).to.equal(updatedListHeight);
          });
        //agHelper.GetNClick(locators._listCollapseToggle);
        entityExplorer.SelectEntityByName("Container1", "List1");

        agHelper.AssertElementAbsence(locators._propertyPaneHeightLabel);
        //Widgets when moved into the list widget have no dynamic height
        entityExplorer.SelectEntityByName("Text3", "Widgets");
        propPane.MoveToTab("Style");

        agHelper.TypeText(locators._body, `{${modifierKey}}c`, 0, true);

        entityExplorer.SelectEntityByName("List1", "Widgets");
        propPane.MoveToTab("Style");
        agHelper.Sleep(500);
        agHelper.TypeText(locators._body, `{${modifierKey}}v`, 0, true);

        assertHelper.AssertNetworkStatus("@updateLayout");
        agHelper.Sleep(2000);
        entityExplorer.NavigateToSwitcher("Explorer");
        entityExplorer.SelectEntityByName("Text3Copy");
        agHelper.AssertElementAbsence(locators._propertyPaneHeightLabel);
        agHelper.TypeText(locators._body, `{${modifierKey}}c`, 0, true);

        agHelper
          .GetElement("[data-testid='div-selection-0']")
          .click({ force: true });
        agHelper.TypeText(locators._body, `{${modifierKey}}v`, 0, true);

        assertHelper.AssertNetworkStatus("@updateLayout");
        //Widgets when moved out of the list widget have dynamic height in property pane
        entityExplorer.SelectEntityByName("Text3CopyCopy", "Widgets");
        agHelper.Sleep(2000);
        agHelper.AssertElementVisible(locators._propertyPaneHeightLabel);
        agHelper.GetNClick(locators._widgetInDeployed("textwidget"));
        agHelper
          .GetWidgetCSSHeight(locators._widgetInDeployed("textwidget"))
          .then((height: number) => {
            propPane.SelectPropertiesDropDown("height", "Auto Height");
            assertHelper.AssertNetworkStatus("@updateLayout");
            agHelper.Sleep(3000);
            agHelper.GetNClick(locators._widgetInDeployed("textwidget"));
            agHelper
              .GetWidgetCSSHeight(locators._widgetInDeployed("textwidget"))
              .wait(1000)
              .then((updatedListHeight: number) => {
                expect(height).to.not.equal(updatedListHeight);
              });
          });
        entityExplorer.SelectEntityByName("Text3CopyCopy", "Widgets");
        agHelper.Sleep(2000);
        agHelper.TypeText(locators._body, `{${modifierKey}}c`, 0, true);

        entityExplorer.SelectEntityByName("List1", "Widgets");
        propPane.MoveToTab("Style");
        agHelper.Sleep(500);
        agHelper.TypeText(locators._body, `{${modifierKey}}v`, 0, true);
        assertHelper.AssertNetworkStatus("@updateLayout");
        agHelper.Sleep(2000);

        //Widgets when copied and pasted into the list widget no longer have dynamic height
        entityExplorer.SelectEntityByName("Text3CopyCopyCopy", "Container1");
        agHelper.Sleep(2000);
        agHelper.AssertElementAbsence(locators._propertyPaneHeightLabel);
        entityExplorer.SelectEntityByName("Text3CopyCopy");
        agHelper.Sleep(2000);
        agHelper.TypeText(locators._body, `{${modifierKey}}x`, 0, true);

        entityExplorer.SelectEntityByName("List1");
        propPane.MoveToTab("Style");
        agHelper.Sleep(500);
        agHelper.TypeText(locators._body, `{${modifierKey}}v`, 0, true);

        assertHelper.AssertNetworkStatus("@updateLayout");
        agHelper.Sleep(2000);
        entityExplorer.SelectEntityByName("Text3CopyCopy", "Widgets");
        agHelper.Sleep(2000);
        agHelper.AssertElementAbsence(locators._propertyPaneHeightLabel);
      });
  });
});
