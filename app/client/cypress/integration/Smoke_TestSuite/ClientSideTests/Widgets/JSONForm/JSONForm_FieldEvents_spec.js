/**
 * Spec to test the events made available by each field type
 */

const dslWithoutSchema = require("../../../../../fixtures/jsonFormDslWithoutSchema.json");
const commonlocators = require("../../../../../locators/commonlocators.json");

const onSelectionChangeJSBtn =
  ".t--property-control-onselectionchange .t--js-toggle";
const fieldPrefix = ".t--jsonformfield";

describe("JSONForm Radio Group Field", () => {
  before(() => {
    const schema = {
      answer: "Y",
    };
    cy.addDsl(dslWithoutSchema);
    cy.openPropertyPane("jsonformwidget");
    cy.testJsontext("sourcedata", JSON.stringify(schema));
    cy.openFieldConfiguration("answer");
    cy.selectDropdownValue(commonlocators.jsonFormFieldType, "Radio Group");
    cy.closePropertyPane();
  });

  it("shows alert on optionChange", () => {
    cy.openPropertyPane("jsonformwidget");
    cy.openFieldConfiguration("answer");

    // Enable JS mode for onSelectionChange
    cy.get(onSelectionChangeJSBtn).click({ force: true });

    // Add onSelectionChange action
    cy.testJsontext("onselectionchange", "{{showAlert('Selection change')}}");

    cy.get(`${fieldPrefix}-answer`)
      .find("label")
      .contains("No")
      .click({ force: true });

    // Check for alert
    cy.get(commonlocators.toastmsg).contains("Selection change");
  });
});
