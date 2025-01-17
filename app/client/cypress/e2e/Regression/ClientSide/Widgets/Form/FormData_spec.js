import * as _ from "../../../../../support/Objects/ObjectsCore";

describe(
  "Form data",
  { tags: ["@tag.All", "@tag.Form", "@tag.Binding"] },
  function () {
    before(() => {
      _.agHelper.AddDsl("formDataDsl");
    });

    it("CheckboxGroupWidget, MultiSelectTreeWidget, MultiSelectWidgetV2, SelectWidget, SingleSelectTreeWidget, SwitchGroupWidget, PhoneInputWidget, InputWidgetV2 and CurrencyInputWidget should have value props of which values are not null or undefined to be included as a form data", function () {
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
  },
);
