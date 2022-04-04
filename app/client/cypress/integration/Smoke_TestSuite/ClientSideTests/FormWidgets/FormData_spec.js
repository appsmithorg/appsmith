const dsl = require("../../../../fixtures/formDataDsl.json");

describe("Form data", function() {
  before(() => {
    cy.addDsl(dsl);
  });

  it("CheckboxGroupWidget, MultiSelectTreeWidget, MultiSelectWidgetV2, SingleSelectTreeWidget, SwitchGroupWidget, PhoneInputWidget, InputWidgetV2 and CurrencyInputWidget should have value props of which values are not null or undefined to be included as a form data", function() {
    // Check form data
    cy.get("[data-testid='container-wrapper-vannrar7rd'] span", {
      timeout: 25000,
    })
      .should("exist")
      .and(($formData) => {
        expect($formData).to.contain("CheckboxGroup");
        expect($formData).to.contain("MultiTreeSelect");
        expect($formData).to.contain("MultiSelect");
        expect($formData).to.contain("TreeSelect");
        expect($formData).to.contain("SwitchGroup");
        expect($formData).to.contain("PhoneInput");
        expect($formData).to.contain("Input");
        expect($formData).to.contain("CurrencyInput");
      });
  });
});
