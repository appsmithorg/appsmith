import {
  entityExplorer,
  propPane,
  agHelper,
  deployMode,
  locators,
  draggableWidgets,
} from "../../../../support/Objects/ObjectsCore";
const testdata = require("../../../../fixtures/testdata.json");

describe(
  "Binding the button Widgets and validating NavigateTo Page functionality",
  { tags: ["@tag.Binding"] },
  function () {
    before(() => {
      entityExplorer.DragDropWidgetNVerify(draggableWidgets.BUTTON);
    });

    it("1. Button widget with action navigate to page", function () {
      propPane.SelectPlatformFunction("onClick", "Navigate to");
      agHelper.GetNClick(propPane._navigateToType("URL"));
      cy.get("label")
        .contains("Enter URL")
        .parent()
        .siblings("div")
        .within(() => {
          cy.get(".t--code-editor-wrapper").type(testdata.externalPage);
        });
      cy.get(propPane._actionCard).should("be.visible");
      // Button click should take the control to page link validation", function () {
      deployMode.DeployApp(locators._widgetInDeployed(draggableWidgets.BUTTON));
      cy.get(locators._widgetInDeployed(draggableWidgets.BUTTON)).should(
        "be.visible",
      );
      agHelper.ClickButton("Submit");
      cy.url().should("include", testdata.externalPage);
      agHelper.AssertElementAbsence(
        locators._widgetInDeployed(draggableWidgets.BUTTON),
      );
      cy.url().should("contain", testdata.externalPage);
    });
  },
);
