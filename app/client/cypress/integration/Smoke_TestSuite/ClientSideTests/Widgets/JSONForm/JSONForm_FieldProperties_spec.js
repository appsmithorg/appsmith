const commonlocators = require("../../../../../locators/commonlocators.json");
const dslWithoutSchema = require("../../../../../fixtures/jsonFormDslWithoutSchema.json");

const fieldPrefix = ".t--jsonformfield";

describe("Text Field Property Control", () => {
  before(() => {
    const schema = {
      name: "John",
    };
    cy.addDsl(dslWithoutSchema);
    cy.openPropertyPane("jsonformwidget");
    cy.testJsontext("sourcedata", JSON.stringify(schema));
  });

  it("has valid default text", () => {
    cy.openFieldConfiguration("name");
    cy.get(".t--property-control-defaultvalue").contains("{{sourceData.name}}");
  });

  it("updated field with change in default text", () => {
    const defaultValue = "New default text";
    cy.testJsontext("defaultvalue", "New default text").wait(200);
    cy.get(`${fieldPrefix}-name input`).should("have.value", defaultValue);
  });

  it("throws max character error when exceeds maxChar limit for default text", () => {
    cy.testJsontext("maxchars", 5);
    cy.get(`${fieldPrefix}-name input`).click();
    cy.get(".bp3-popover-content").should(($x) => {
      expect($x).contain("Default text length must be less than 5 characters");
    });
    cy.testJsontext("maxchars", "");
  });

  it("throws max character error when exceeds maxChar limit for input text", () => {
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

  it("sets placeholder", () => {
    const placeholderText = "First name";
    cy.testJsontext("placeholder", placeholderText);
    cy.get(`${fieldPrefix}-name input`)
      .invoke("attr", "placeholder")
      .should("contain", placeholderText);
  });

  it("sets valid property with custom error message", () => {
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

  it("hides field when visible switched off", () => {
    cy.togglebarDisable(`.t--property-control-visible input`);
    cy.get(`${fieldPrefix}-name`).should("not.exist");
    cy.wait(500);
    cy.togglebar(`.t--property-control-visible input`);
    cy.get(`${fieldPrefix}-name`).should("exist");
  });

  it("disables field when disabled switched on", () => {
    cy.togglebar(`.t--property-control-disabled input`);
    cy.get(`${fieldPrefix}-name input`).each(($el) => {
      cy.wrap($el).should("have.attr", "disabled");
    });

    cy.togglebarDisable(`.t--property-control-disabled input`);
  });

  it("throws error when REGEX does not match the input value", () => {
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
});

describe("Checkbox Field Property Control", () => {
  before(() => {
    const schema = {
      check: false,
    };
    cy.addDsl(dslWithoutSchema);
    cy.openPropertyPane("jsonformwidget");
    cy.testJsontext("sourcedata", JSON.stringify(schema));
    cy.openFieldConfiguration("check");
    cy.selectDropdownValue(commonlocators.jsonFormFieldType, "Checkbox");
  });

  it("has default property", () => {
    cy.get(".t--property-control-defaultselected").contains(
      "{{sourceData.check}}",
    );
  });

  it("should update field checked state when default selected changed", () => {
    cy.testJsontext("defaultselected", "{{true}}");
    cy.get(`${fieldPrefix}-check input`).should("be.checked");
  });

  it("hides field when visible switched off", () => {
    cy.togglebarDisable(`.t--property-control-visible input`);
    cy.get(`${fieldPrefix}-check`).should("not.exist");
    cy.wait(500);
    cy.togglebar(`.t--property-control-visible input`);
    cy.get(`${fieldPrefix}-check`).should("exist");
  });

  it("disables field when disabled switched on", () => {
    cy.togglebar(`.t--property-control-disabled input`);
    cy.get(`${fieldPrefix}-check input`).each(($el) => {
      cy.wrap($el).should("have.attr", "disabled");
    });

    cy.togglebarDisable(`.t--property-control-disabled input`);
  });
});

describe("Switch Field Property Control", () => {
  before(() => {
    const schema = {
      switch: true,
    };
    cy.addDsl(dslWithoutSchema);
    cy.openPropertyPane("jsonformwidget");
    cy.testJsontext("sourcedata", JSON.stringify(schema));
    cy.openFieldConfiguration("switch");
  });

  it("has default property", () => {
    cy.get(".t--property-control-defaultselected").contains(
      "{{sourceData.switch}}",
    );
  });

  it("should update field checked state when default selected changed", () => {
    cy.testJsontext("defaultselected", "{{false}}");
    cy.get(`${fieldPrefix}-switch label.bp3-control.bp3-switch`).should(
      "have.class",
      "t--switch-widget-inactive",
    );
  });

  it("hides field when visible switched off", () => {
    cy.togglebarDisable(`.t--property-control-visible input`);
    cy.get(`${fieldPrefix}-switch`).should("not.exist");
    cy.wait(500);
    cy.togglebar(`.t--property-control-visible input`);
    cy.get(`${fieldPrefix}-switch`).should("exist");
  });

  it("disables field when disabled switched on", () => {
    cy.togglebar(`.t--property-control-disabled input`);
    cy.get(`${fieldPrefix}-switch input`).each(($el) => {
      cy.wrap($el).should("have.attr", "disabled");
    });

    cy.togglebarDisable(`.t--property-control-disabled input`);
  });
});

describe("Select Field Property Control", () => {
  before(() => {
    const schema = {
      state: "Karnataka",
    };
    cy.addDsl(dslWithoutSchema);
    cy.openPropertyPane("jsonformwidget");
    cy.testJsontext("sourcedata", JSON.stringify(schema));
    cy.openFieldConfiguration("state");
    cy.selectDropdownValue(commonlocators.jsonFormFieldType, /^Select/);
  });

  it("has valid default value", () => {
    cy.get(".t--property-control-defaultvalue").contains(
      "{{sourceData.state}}",
    );
  });

  it("makes select filterable", () => {
    // click select field and filter input should not exist
    cy.get(`${fieldPrefix}-state .bp3-control-group`).click({ force: true });
    cy.get(`.bp3-select-popover .bp3-input-group`).should("not.exist");

    // toggle filterable -> true in property pane
    cy.togglebar(`.t--property-control-filterable input`);

    // click select field and filter input should exist
    cy.get(`${fieldPrefix}-state .bp3-control-group`).click({ force: true });
    cy.get(`.bp3-select-popover .bp3-input-group`).should("exist");
  });

  it("hides field when visible switched off", () => {
    cy.togglebarDisable(`.t--property-control-visible input`);
    cy.get(`${fieldPrefix}-state`).should("not.exist");
    cy.wait(500);
    cy.togglebar(`.t--property-control-visible input`);
    cy.get(`${fieldPrefix}-state`).should("exist");
  });

  it("disables field when disabled switched on", () => {
    cy.togglebar(`.t--property-control-disabled input`);
    cy.get(`${fieldPrefix}-state button.bp3-button`).should(
      "have.class",
      "bp3-disabled",
    );

    cy.togglebarDisable(`.t--property-control-disabled input`);
  });
});

describe("Multi-Select Field Property Control", () => {
  before(() => {
    const schema = {
      hobbies: [],
    };
    cy.addDsl(dslWithoutSchema);
    cy.openPropertyPane("jsonformwidget");
    cy.testJsontext("sourcedata", JSON.stringify(schema));
    cy.openFieldConfiguration("hobbies");
  });

  it("has valid default value", () => {
    cy.get(".t--property-control-defaultvalue").contains(
      "{{sourceData.hobbies}}",
    );
    cy.closePropertyPane();
  });

  it("adds placeholder text", () => {
    cy.openPropertyPane("jsonformwidget");
    cy.openFieldConfiguration("hobbies");

    cy.testJsontext("placeholder", "Select placeholder");
    cy.wait(2000);
    cy.get(`.rc-select-selection-placeholder`).contains("Select placeholder");
  });

  it("hides field when visible switched off", () => {
    cy.togglebarDisable(`.t--property-control-visible input`);
    cy.get(`${fieldPrefix}-hobbies`).should("not.exist");
    cy.wait(500);
    cy.togglebar(`.t--property-control-visible input`);
    cy.get(`${fieldPrefix}-hobbies`).should("exist");
  });

  it("disables field when disabled switched on", () => {
    cy.togglebar(`.t--property-control-disabled input`);
    cy.get(`${fieldPrefix}-hobbies .rc-select-multiple`).should(
      "have.class",
      "rc-select-disabled",
    );

    cy.togglebarDisable(`.t--property-control-disabled input`);
  });
});

describe("Radio group Field Property Control", () => {
  before(() => {
    const sourceData = {
      radio: "Y",
    };
    cy.addDsl(dslWithoutSchema);
    cy.openPropertyPane("jsonformwidget");
    cy.testJsontext("sourcedata", JSON.stringify(sourceData));
    cy.openFieldConfiguration("radio");
    cy.selectDropdownValue(commonlocators.jsonFormFieldType, "Radio Group");
  });

  it("has valid default value", () => {
    cy.get(".t--property-control-defaultselectedvalue").contains(
      "{{sourceData.radio}}",
    );

    cy.get(`${fieldPrefix}-radio input`).should("have.value", "Y");
  });

  it("hides field when visible switched off", () => {
    cy.togglebarDisable(`.t--property-control-visible input`);
    cy.get(`${fieldPrefix}-radio`).should("not.exist");
    cy.wait(500);
    cy.togglebar(`.t--property-control-visible input`);
    cy.get(`${fieldPrefix}-radio`).should("exist");
  });
});
