const widgetsPage = require("../../../../../locators/Widgets.json");
const { agHelper } = require("../../../../../support/Objects/ObjectsCore");

const widgetName = "inputwidgetv2";

describe(
  "Input Widget V2 showStepArrows Functionality - ",
  { tags: ["@tag.Widget", "@tag.Input", "@tag.Binding"] },
  function () {
    it("1. Validate that dataType - NUMBER, For new widgets being dragged, the value for showStepArrows should be set to false", () => {
      cy.dragAndDropToCanvas(widgetName, { x: 300, y: 400 });
      cy.openPropertyPane(widgetName);

      cy.selectDropdownValue(widgetsPage.inputPropsDataType, "Number");

      cy.get(widgetsPage.showStepArrowsToggleCheckBox).should("not.be.checked");

      cy.get(widgetsPage.inputStepArrows).should("not.exist"); // This is the step arrows
      //Validate that dataType - NUMBER, stepArrows should be visible when showStepArrows is set to true
      // Enable showStepArrows to true
      agHelper.CheckUncheck(widgetsPage.showStepArrowsToggleCheckBox);

      cy.get(widgetsPage.inputStepArrows).should("exist"); // step arrows should be visible
      //Toggle test case to validate that dataType - NUMBER, stepArrows should be hidden when toggle value is false
      // click on the Js
      cy.get(widgetsPage.toggleShowStepArrows).click({ force: true });

      // Add showStepArrows action and value as false
      cy.testJsontext("showsteparrows", `{{false}}`);

      cy.get(widgetsPage.inputStepArrows).should("not.exist"); // step arrows should not be visible

      //Toggle test case to validate that dataType - NUMBER, stepArrows should be visible when toggle value is true
      // Add showStepArrows action and add value as true
      cy.testJsontext("showsteparrows", `{{true}}`);

      cy.get(widgetsPage.inputStepArrows).should("exist"); // step arrows should be visible
    });
  },
);
