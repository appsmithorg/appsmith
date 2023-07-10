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

  it("1. Switch Field Property Control - pre condition", () => {
    const schema = {
      switch: true,
    };
    _.agHelper.AddDsl("jsonFormDslWithoutSchema");

    cy.openPropertyPane("jsonformwidget");
    cy.testJsontext("sourcedata", JSON.stringify(schema));
    cy.openFieldConfiguration("switch");
  });

  it("2. has default property", () => {
    cy.get(".t--property-control-defaultselected").contains(
      "{{sourceData.switch}}",
    );
  });

  it("3. should update field checked state when default selected changed", () => {
    cy.testJsontext("defaultselected", "{{false}}");
    cy.get(`${fieldPrefix}-switch label.bp3-control.bp3-switch`).should(
      "have.class",
      "t--switch-widget-inactive",
    );
  });

  it("4. hides field when visible switched off", () => {
    cy.togglebarDisable(`.t--property-control-visible input`);
    cy.get(`${fieldPrefix}-switch`).should("not.exist");
    cy.wait(500);
    cy.togglebar(`.t--property-control-visible input`);
    cy.get(`${fieldPrefix}-switch`).should("exist");
  });

  it("5. disables field when disabled switched on", () => {
    cy.togglebar(`.t--property-control-disabled input`);
    cy.get(`${fieldPrefix}-switch input`).each(($el) => {
      cy.wrap($el).should("have.attr", "disabled");
    });

    cy.togglebarDisable(`.t--property-control-disabled input`);
  });

  it("6. Select Field Property Control - pre condition", () => {
    const schema = {
      state: "Karnataka",
    };
    _.agHelper.AddDsl("jsonFormDslWithoutSchema");

    cy.openPropertyPane("jsonformwidget");
    cy.testJsontext("sourcedata", JSON.stringify(schema));
    cy.openFieldConfiguration("state");
    cy.selectDropdownValue(commonlocators.jsonFormFieldType, /^Select/);
  });

  it("7. has valid default value", () => {
    cy.get(".t--property-control-defaultselectedvalue").contains(
      "{{sourceData.state}}",
    );
  });

  it("8. makes select filterable", () => {
    // click select field and filter input should not exist
    cy.get(`${fieldPrefix}-state .bp3-control-group`).click({ force: true });
    cy.get(`.bp3-select-popover .bp3-input-group`).should("not.exist");

    // toggle filterable -> true in property pane
    cy.togglebar(`.t--property-control-allowsearching input`);

    // click select field and filter input should exist
    cy.get(`${fieldPrefix}-state .bp3-control-group`).click({ force: true });
    cy.get(`.bp3-select-popover .bp3-input-group`).should("exist");
  });

  it("9. hides field when visible switched off", () => {
    cy.togglebarDisable(`.t--property-control-visible input`);
    cy.get(`${fieldPrefix}-state`).should("not.exist");
    cy.wait(500);
    cy.togglebar(`.t--property-control-visible input`);
    cy.get(`${fieldPrefix}-state`).should("exist");
  });

  it("10. disables field when disabled switched on", () => {
    cy.togglebar(`.t--property-control-disabled input`);
    cy.get(`${fieldPrefix}-state button.bp3-button`).should(
      "have.class",
      "bp3-disabled",
    );

    cy.togglebarDisable(`.t--property-control-disabled input`);
  });

  it("11. Multi Field Property Control - pre condition", () => {
    const schema = {
      hobbies: [],
    };
    _.agHelper.AddDsl("jsonFormDslWithoutSchema");

    cy.openPropertyPane("jsonformwidget");
    cy.testJsontext("sourcedata", JSON.stringify(schema));
    cy.openFieldConfiguration("hobbies");
  });

  it("12. has valid default value", () => {
    cy.get(".t--property-control-defaultselectedvalues").contains(
      "{{sourceData.hobbies}}",
    );
    cy.closePropertyPane();
  });

  it("13. adds placeholder text", () => {
    cy.openPropertyPane("jsonformwidget");
    cy.openFieldConfiguration("hobbies");

    cy.testJsontext("placeholder", "Select placeholder");
    cy.wait(2000);
    cy.get(`.rc-select-selection-placeholder`).contains("Select placeholder");
  });

  it("14. hides field when visible switched off", () => {
    cy.togglebarDisable(`.t--property-control-visible input`);
    cy.get(`${fieldPrefix}-hobbies`).should("not.exist");
    cy.wait(500);
    cy.togglebar(`.t--property-control-visible input`);
    cy.get(`${fieldPrefix}-hobbies`).should("exist");
  });

  it("15. disables field when disabled switched on", () => {
    cy.togglebar(`.t--property-control-disabled input`);
    cy.get(`${fieldPrefix}-hobbies .rc-select-multiple`).should(
      "have.class",
      "rc-select-disabled",
    );

    cy.togglebarDisable(`.t--property-control-disabled input`);
  });

  it("16. Invalid options should not crash the widget", () => {
    // clear Options
    cy.testJsonTextClearMultiline("options");
    // enter invalid options
    cy.testJsontext("options", '{{[{ label: "asd", value: "zxc"}, null ]}}');

    // wait for eval to update
    cy.wait(2000);
    // Check if the multiselect field exist
    cy.get(`${fieldPrefix}-hobbies`).should("exist");

    // clear Default Selected Values
    cy.testJsonTextClearMultiline("defaultselectedvalues");
    // enter default value
    cy.testJsontext("defaultselectedvalues", '["zxc"]');

    // wait for eval to update
    cy.wait(2000);
    // Check if the multiselect field exist
    cy.get(`${fieldPrefix}-hobbies`).should("exist");
  });

  it("17. Radio group Field Property Control - pre condition", () => {
    const sourceData = {
      radio: "Y",
    };
    _.agHelper.AddDsl("jsonFormDslWithoutSchema");

    cy.openPropertyPane("jsonformwidget");
    cy.testJsontext("sourcedata", JSON.stringify(sourceData));
    cy.openFieldConfiguration("radio");
    cy.selectDropdownValue(commonlocators.jsonFormFieldType, "Radio Group");
  });

  it("18. has valid default value", () => {
    cy.get(".t--property-control-defaultselectedvalue").contains(
      "{{sourceData.radio}}",
    );

    cy.get(`${fieldPrefix}-radio input`).should("have.value", "Y");
  });

  it("19. hides field when visible switched off", () => {
    cy.togglebarDisable(`.t--property-control-visible input`);
    cy.get(`${fieldPrefix}-radio`).should("not.exist");
    cy.wait(500);
    cy.togglebar(`.t--property-control-visible input`);
    cy.get(`${fieldPrefix}-radio`).should("exist");
  });
});
