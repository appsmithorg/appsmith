const commonlocators = require("../../../../../locators/commonlocators.json");
import * as _ from "../../../../../support/Objects/ObjectsCore";

const fieldPrefix = ".t--jsonformfield";

describe("Text Field Property Control", () => {
  beforeEach(() => {
    _.agHelper.RestoreLocalStorageCache();
  });

  afterEach(() => {
    _.agHelper.SaveLocalStorageCache();
  });

  before(() => {
    const schema = {
      name: "John",
    };
    _.agHelper.AddDsl("jsonFormDslWithoutSchema");

    cy.openPropertyPane("jsonformwidget");
    cy.testJsontext("sourcedata", JSON.stringify(schema));
  });

  it("1. has valid default text", () => {
    cy.openFieldConfiguration("name");
    cy.get(".t--property-control-defaultvalue").contains("{{sourceData.name}}");
  });

  it("2. updated field with change in default text", () => {
    const defaultValue = "New default text";
    cy.testJsontext("defaultvalue", "New default text").wait(200);
    cy.get(`${fieldPrefix}-name input`).should("have.value", defaultValue);
  });

  it("3. throws max character error when exceeds maxChar limit for default text", () => {
    cy.testJsontext("maxchars", 5);
    cy.get(`${fieldPrefix}-name input`).click();
    cy.get(".bp3-popover-content").should(($x) => {
      expect($x).contain(
        "Default text length must be less than or equal to 5 characters",
      );
    });
    cy.testJsontext("maxchars", "");
  });

  it("4. throws max character error when exceeds maxChar limit for input text", () => {
    cy.testJsontext("defaultvalue", "").wait(200);
    cy.get(`${fieldPrefix}-name input`).clear().type("abcdefghi");
    cy.testJsontext("maxchars", 5).wait(200);
    cy.get(`${fieldPrefix}-name input`).click();
    cy.get(".bp3-popover-content").should(($x) => {
      expect($x).contain("Input text length must be less than 5 characters");
    });
    cy.testJsontext("maxchars", "");
  });

  it("5. sets placeholder", () => {
    const placeholderText = "First name";
    cy.testJsontext("placeholder", placeholderText);
    cy.get(`${fieldPrefix}-name input`)
      .invoke("attr", "placeholder")
      .should("contain", placeholderText);
  });

  it("6. sets valid property with custom error message", () => {
    cy.testJsontext("valid", "false");
    cy.get(`${fieldPrefix}-name input`).clear().type("abcd");
    cy.get(".bp3-popover-content").contains("Invalid input");

    cy.testJsontext("errormessage", "Custom error message");
    cy.get(`${fieldPrefix}-name input`).click({ force: true });
    cy.get(".bp3-popover-content").contains("Custom error message");

    // Reset the error message
    cy.testJsontext("errormessage", "");
    // Reset valid
    cy.testJsontext("valid", "");
  });

  it("7. hides field when visible switched off", () => {
    cy.togglebarDisable(`.t--property-control-visible input`);
    cy.get(`${fieldPrefix}-name`).should("not.exist");
    cy.wait(500);
    cy.togglebar(`.t--property-control-visible input`);
    cy.get(`${fieldPrefix}-name`).should("exist");
  });

  it("8. disables field when disabled switched on and when autofill is disabled we should see the autofill attribute in the input field", () => {
    cy.togglebar(`.t--property-control-disabled input`);
    cy.get(`${fieldPrefix}-name input`).each(($el) => {
      cy.wrap($el).should("have.attr", "disabled");
    });

    cy.togglebarDisable(`.t--property-control-disabled input`);
    validateAutocompleteAttributeInJSONForm();
  });

  it("9. throws error when REGEX does not match the input value", () => {
    cy.testJsontext("regex", "^\\d+$");
    cy.get(`${fieldPrefix}-name input`).clear().type("abcd");
    cy.get(".bp3-popover-content").contains("Invalid input");

    cy.get(`${fieldPrefix}-name input`).clear().type("1234");
    cy.get(".bp3-popover-content").should("not.exist");
  });

  it("10. Checkbox Field Property Control - pre condition", () => {
    const schema = {
      check: false,
    };
    _.agHelper.AddDsl("jsonFormDslWithoutSchema");

    cy.openPropertyPane("jsonformwidget");
    cy.testJsontext("sourcedata", JSON.stringify(schema));
    cy.openFieldConfiguration("check");
    cy.selectDropdownValue(commonlocators.jsonFormFieldType, "Checkbox");
  });

  it("11. has default property", () => {
    cy.get(".t--property-control-defaultstate").contains(
      "{{sourceData.check}}",
    );
  });

  it("12. should update field checked state when default selected changed", () => {
    cy.testJsontext("defaultstate", "{{true}}");
    cy.get(`${fieldPrefix}-check input`).should("be.checked");
  });

  it("13. hides field when visible switched off", () => {
    cy.togglebarDisable(`.t--property-control-visible input`);
    cy.get(`${fieldPrefix}-check`).should("not.exist");
    cy.wait(500);
    cy.togglebar(`.t--property-control-visible input`);
    cy.get(`${fieldPrefix}-check`).should("exist");
  });

  it("14. disables field when disabled switched on", () => {
    cy.togglebar(`.t--property-control-disabled input`);
    cy.get(`${fieldPrefix}-check input`).each(($el) => {
      cy.wrap($el).should("have.attr", "disabled");
    });

    cy.togglebarDisable(`.t--property-control-disabled input`);
  });
});

function validateAutocompleteAttributeInJSONForm() {
  //select password input fiel
  cy.selectDropdownValue(commonlocators.jsonFormFieldType, "Password Input");

  //check if autofill toggle option is present and is checked by default
  cy.get(".t--property-control-allowautofill input").should("be.checked");
  //check if autocomplete attribute is not present in the text widget when autofill is enabled
  cy.get(`${fieldPrefix}-name input`).should("not.have.attr", "autocomplete");

  //toggle off autofill
  cy.get(".t--property-control-allowautofill input").click({ force: true });
  cy.get(".t--property-control-allowautofill input").should("not.be.checked");

  //autocomplete should now be present in the text widget
  cy.get(`${fieldPrefix}-name input`).should(
    "have.attr",
    "autocomplete",
    "off",
  );

  //select a non email or password option
  cy.selectDropdownValue(commonlocators.jsonFormFieldType, /^Text Input/);
  //autofill toggle should not be present as this restores autofill to be enabled
  cy.get(".t--property-control-allowautofill input").should("not.exist");
  //autocomplete attribute should not be present in the text widget
  cy.get(`${fieldPrefix}-name input`).should("not.have.attr", "autocomplete");
}
