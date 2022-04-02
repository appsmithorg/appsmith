const dsl = require("../../../../fixtures/formDataDsl.json");

describe("Form data", function() {
  before(() => {
    cy.addDsl(dsl);
  });

  it("CheckboxGroupWidget, MultiSelectTreeWidget, MultiSelectWidgetV2, SingleSelectTreeWidget and SwitchGroupWidget should have value prop to support form data", function() {
    // Check form data
    cy.get("[data-testid='container-wrapper-ibrrnyba83'] span", {
      timeout: 25000,
    })
      .should("exist")
      .and(($formData) => {
        expect($formData).to.contain("CheckboxGroup");
        expect($formData).to.contain("MultiTreeSelect");
        expect($formData).to.contain("MultiSelect");
        expect($formData).to.contain("TreeSelect");
        expect($formData).to.contain("SwitchGroup");
      });
  });
});
