const dsl = require("../../../../../fixtures/formDataDsl.json");

describe("Form data", function() {
  before(() => {
    cy.addDsl(dsl);
  });

  it("CheckboxGroupWidget, MultiSelectTreeWidget, MultiSelectWidgetV2, SelectWidget, SingleSelectTreeWidget, SwitchGroupWidget, PhoneInputWidget, InputWidgetV2 and CurrencyInputWidget should have value props of which values are not null or undefined to be included as a form data", function() {
    cy.wait("@updateLayout").should(
      "have.nested.property",
      "response.body.responseMeta.status",
      200,
    );
    // Check form data
    cy.get("[data-testid='container-wrapper-vannrar7rd'] span")
      .should("exist")
      .and(($formData) => {
        expect($formData).to.contain("FormCheckboxGroupWidget");
        expect($formData).to.contain("FormMultiSelectTreeWidget");
        expect($formData).to.contain("FormMultiSelectWidgetV2");
        expect($formData).to.contain("FormSingleSelectTreeWidget");
        expect($formData).to.contain("FormSwitchGroupWidget");
        expect($formData).to.contain("FormSelectWidget");
        expect($formData).to.contain("FormPhoneInputWidget");
        expect($formData).to.contain("FormInputWidgetV2");
        expect($formData).to.contain("FormCurrencyInputWidget");
      });
  });
});
