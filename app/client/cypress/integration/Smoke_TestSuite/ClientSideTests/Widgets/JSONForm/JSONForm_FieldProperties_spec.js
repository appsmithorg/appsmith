const commonlocators = require("../../../../../locators/commonlocators.json");
const dslWithoutSchema = require("../../../../../fixtures/jsonFormDslWithoutSchema.json");
import { ObjectsRegistry } from "../../../../../support/Objects/Registry";

const fieldPrefix = ".t--jsonformfield";
let agHelper = ObjectsRegistry.AggregateHelper;

describe("Text Field Property Control", () => {
  beforeEach(() => {
    agHelper.RestoreLocalStorageCache();
  });

  afterEach(() => {
    agHelper.SaveLocalStorageCache();
  });

  before(() => {
    const schema = {
      name: "John",
    };
    cy.addDsl(dslWithoutSchema);
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
    cy.get(`${fieldPrefix}-name input`)
      .clear()
      .type("abcdefghi");
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
    cy.get(`${fieldPrefix}-name input`)
      .clear()
      .type("abcd");
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

  it("8. disables field when disabled switched on", () => {
    cy.togglebar(`.t--property-control-disabled input`);
    cy.get(`${fieldPrefix}-name input`).each(($el) => {
      cy.wrap($el).should("have.attr", "disabled");
    });

    cy.togglebarDisable(`.t--property-control-disabled input`);
  });

  it("9. throws error when REGEX does not match the input value", () => {
    cy.testJsontext("regex", "^\\d+$");
    cy.get(`${fieldPrefix}-name input`)
      .clear()
      .type("abcd");
    cy.get(".bp3-popover-content").contains("Invalid input");

    cy.get(`${fieldPrefix}-name input`)
      .clear()
      .type("1234");
    cy.get(".bp3-popover-content").should("not.exist");
  });

  it("10. Checkbox Field Property Control - pre condition", () => {
    const schema = {
      check: false,
    };
    cy.addDsl(dslWithoutSchema);
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

  it("15. Switch Field Property Control - pre condition", () => {
    const schema = {
      switch: true,
    };
    cy.addDsl(dslWithoutSchema);
    cy.openPropertyPane("jsonformwidget");
    cy.testJsontext("sourcedata", JSON.stringify(schema));
    cy.openFieldConfiguration("switch");
  });

  it("16. has default property", () => {
    cy.get(".t--property-control-defaultselected").contains(
      "{{sourceData.switch}}",
    );
  });

  it("17. should update field checked state when default selected changed", () => {
    cy.testJsontext("defaultselected", "{{false}}");
    cy.get(`${fieldPrefix}-switch label.bp3-control.bp3-switch`).should(
      "have.class",
      "t--switch-widget-inactive",
    );
  });

  it("18. hides field when visible switched off", () => {
    cy.togglebarDisable(`.t--property-control-visible input`);
    cy.get(`${fieldPrefix}-switch`).should("not.exist");
    cy.wait(500);
    cy.togglebar(`.t--property-control-visible input`);
    cy.get(`${fieldPrefix}-switch`).should("exist");
  });

  it("19. disables field when disabled switched on", () => {
    cy.togglebar(`.t--property-control-disabled input`);
    cy.get(`${fieldPrefix}-switch input`).each(($el) => {
      cy.wrap($el).should("have.attr", "disabled");
    });

    cy.togglebarDisable(`.t--property-control-disabled input`);
  });

  it("20. Select Field Property Control - pre condition", () => {
    const schema = {
      state: "Karnataka",
    };
    cy.addDsl(dslWithoutSchema);
    cy.openPropertyPane("jsonformwidget");
    cy.testJsontext("sourcedata", JSON.stringify(schema));
    cy.openFieldConfiguration("state");
    cy.selectDropdownValue(commonlocators.jsonFormFieldType, /^Select/);
  });

  it("21. has valid default value", () => {
    cy.get(".t--property-control-defaultselectedvalue").contains(
      "{{sourceData.state}}",
    );
  });

  it("22. makes select filterable", () => {
    // click select field and filter input should not exist
    cy.get(`${fieldPrefix}-state .bp3-control-group`).click({ force: true });
    cy.get(`.bp3-select-popover .bp3-input-group`).should("not.exist");

    // toggle filterable -> true in property pane
    cy.togglebar(`.t--property-control-allowsearching input`);

    // click select field and filter input should exist
    cy.get(`${fieldPrefix}-state .bp3-control-group`).click({ force: true });
    cy.get(`.bp3-select-popover .bp3-input-group`).should("exist");
  });

  it("23. hides field when visible switched off", () => {
    cy.togglebarDisable(`.t--property-control-visible input`);
    cy.get(`${fieldPrefix}-state`).should("not.exist");
    cy.wait(500);
    cy.togglebar(`.t--property-control-visible input`);
    cy.get(`${fieldPrefix}-state`).should("exist");
  });

  it("24. disables field when disabled switched on", () => {
    cy.togglebar(`.t--property-control-disabled input`);
    cy.get(`${fieldPrefix}-state button.bp3-button`).should(
      "have.class",
      "bp3-disabled",
    );

    cy.togglebarDisable(`.t--property-control-disabled input`);
  });

  it("25. Multi Field Property Control - pre condition", () => {
    const schema = {
      hobbies: [],
    };
    cy.addDsl(dslWithoutSchema);
    cy.openPropertyPane("jsonformwidget");
    cy.testJsontext("sourcedata", JSON.stringify(schema));
    cy.openFieldConfiguration("hobbies");
  });

  it("26. has valid default value", () => {
    cy.get(".t--property-control-defaultselectedvalues").contains(
      "{{sourceData.hobbies}}",
    );
    cy.closePropertyPane();
  });

  it("27. adds placeholder text", () => {
    cy.openPropertyPane("jsonformwidget");
    cy.openFieldConfiguration("hobbies");

    cy.testJsontext("placeholder", "Select placeholder");
    cy.wait(2000);
    cy.get(`.rc-select-selection-placeholder`).contains("Select placeholder");
  });

  it("28. hides field when visible switched off", () => {
    cy.togglebarDisable(`.t--property-control-visible input`);
    cy.get(`${fieldPrefix}-hobbies`).should("not.exist");
    cy.wait(500);
    cy.togglebar(`.t--property-control-visible input`);
    cy.get(`${fieldPrefix}-hobbies`).should("exist");
  });

  it("29. disables field when disabled switched on", () => {
    cy.togglebar(`.t--property-control-disabled input`);
    cy.get(`${fieldPrefix}-hobbies .rc-select-multiple`).should(
      "have.class",
      "rc-select-disabled",
    );

    cy.togglebarDisable(`.t--property-control-disabled input`);
  });

  it("30. Radio group Field Property Control - pre condition", () => {
    const sourceData = {
      radio: "Y",
    };
    cy.addDsl(dslWithoutSchema);
    cy.openPropertyPane("jsonformwidget");
    cy.testJsontext("sourcedata", JSON.stringify(sourceData));
    cy.openFieldConfiguration("radio");
    cy.selectDropdownValue(commonlocators.jsonFormFieldType, "Radio Group");
  });

  it("31. has valid default value", () => {
    cy.get(".t--property-control-defaultselectedvalue").contains(
      "{{sourceData.radio}}",
    );

    cy.get(`${fieldPrefix}-radio input`).should("have.value", "Y");
  });

  it("32. hides field when visible switched off", () => {
    cy.togglebarDisable(`.t--property-control-visible input`);
    cy.get(`${fieldPrefix}-radio`).should("not.exist");
    cy.wait(500);
    cy.togglebar(`.t--property-control-visible input`);
    cy.get(`${fieldPrefix}-radio`).should("exist");
  });
});
