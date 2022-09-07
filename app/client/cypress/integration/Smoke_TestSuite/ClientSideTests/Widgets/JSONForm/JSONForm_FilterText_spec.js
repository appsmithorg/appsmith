/**
 * Spec to test the filterText update action trigger in Select and MultiSelect widget
 */

const dslWithoutSchema = require("../../../../../fixtures/jsonFormDslWithoutSchema.json");
const commonlocators = require("../../../../../locators/commonlocators.json");

const onFilterUpdateJSBtn = ".t--property-control-onfilterupdate .t--js-toggle";
const fieldPrefix = ".t--jsonformfield";

describe("JSONForm Select field - filterText update action trigger ", () => {
  before(() => {
    const schema = {
      color: "GREEN",
    };
    cy.addDsl(dslWithoutSchema);
    cy.openPropertyPane("jsonformwidget");
    cy.testJsontext("sourcedata", JSON.stringify(schema));
    cy.openFieldConfiguration("color");
    cy.selectDropdownValue(commonlocators.jsonFormFieldType, /^Select$/);
    cy.closePropertyPane();
  });

  it("shows alert on filter text change", () => {
    const filterText = "Test string";

    cy.openPropertyPane("jsonformwidget");
    cy.openFieldConfiguration("color");

    // Enable filterable
    cy.togglebar(`.t--property-control-filterable input`);
    // Enable server side filtering
    cy.togglebar(`.t--property-control-serversidefiltering input`);

    // Enable JS mode for onFilterUpdate
    cy.get(onFilterUpdateJSBtn).click({ force: true });

    // Add onFilterUpdate action
    cy.testJsontext(
      "onfilterupdate",
      "{{showAlert('Filter update:' + fieldState?.color?.filterText)}}",
    );

    // click select field and filter input should exist
    cy.get(`${fieldPrefix}-color .bp3-control-group`).click({ force: true });
    cy.get(`.bp3-select-popover .bp3-input-group`).should("exist");

    // Type "Test string" in the filterable input.
    cy.get(`.bp3-select-popover .bp3-input-group input`).type(filterText);

    cy.get(commonlocators.toastmsg).contains(`Filter update:${filterText}`);
  });
});

describe("JSONForm Multiselect field - filterText update action trigger ", () => {
  before(() => {
    const schema = {
      colors: ["GREEN", "BLUE"],
    };
    cy.addDsl(dslWithoutSchema);
    cy.openPropertyPane("jsonformwidget");
    cy.testJsontext("sourcedata", JSON.stringify(schema));
    cy.closePropertyPane();
  });

  it("shows alert on filter text change", () => {
    const filterText = "Test string";

    cy.openPropertyPane("jsonformwidget");
    cy.openFieldConfiguration("colors");

    // Enable filterable
    cy.togglebar(`.t--property-control-filterable input`);
    // Enable server side filtering
    cy.togglebar(`.t--property-control-serversidefiltering input`);

    // Enable JS mode for onFilterUpdate
    cy.get(onFilterUpdateJSBtn).click({ force: true });

    // Add onFilterUpdate action
    cy.testJsontext(
      "onfilterupdate",
      "{{showAlert('Filter update:' + fieldState?.colors?.filterText)}}",
    );

    // Open multiselect field and filter input should exist
    cy.get(`${fieldPrefix}-colors`)
      .find(".rc-select-selection-search-input")
      .first()
      .focus({ force: true })
      .type("{uparrow}", { force: true });
    cy.get(".multi-select-dropdown input.bp3-input").should("exist");

    // Type "Test string" in the filterable input.
    cy.get(".multi-select-dropdown input.bp3-input").type(filterText);

    cy.get(commonlocators.toastmsg).contains(`Filter update:${filterText}`);
  });
});
