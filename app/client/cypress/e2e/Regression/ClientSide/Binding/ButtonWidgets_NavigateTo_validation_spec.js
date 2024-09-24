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
      cy.wait(300);
      // Button click should take the control to page link validation", function () {
      deployMode.DeployApp(locators._widgetInDeployed(draggableWidgets.BUTTON));
      cy.wait(2000);
      agHelper.ClickButton("Submit");
      cy.wait(4000); //for page to load
      agHelper.AssertElementAbsence(
        locators._widgetInDeployed(draggableWidgets.BUTTON),
      );
      cy.url().should("contain", testdata.externalPage);
    });
  },
);
