/**
 * This spec test the working of select and multiselect within an
 * Object or Array field
 */

const commonlocators = require("../../../../../locators/commonlocators.json");
const dslWithoutSchema = require("../../../../../fixtures/jsonFormDslWithoutSchema.json");
const fieldPrefix = ".t--jsonformfield";

describe("JSONForm select field", () => {
  before(() => {
    const schema = {
      object: {
        select: "GREEN",
      },
      array: [
        {
          select: "RED",
        },
      ],
    };
    cy.addDsl(dslWithoutSchema);
    cy.openPropertyPane("jsonformwidget");
    cy.testJsontext("sourcedata", JSON.stringify(schema));
    cy.openFieldConfiguration("object");
    cy.openFieldConfiguration("select");
    cy.selectDropdownValue(commonlocators.jsonFormFieldType, /^Select$/);

    cy.closePropertyPane();
    cy.openPropertyPane("jsonformwidget");
    cy.openFieldConfiguration("array");
    cy.openFieldConfiguration("__array_item__");
    cy.openFieldConfiguration("select");
    cy.selectDropdownValue(commonlocators.jsonFormFieldType, /^Select$/);
  });

  it("should open the menu", () => {
    // Click select field in object
    cy.get(`${fieldPrefix}-object-select label`).click({ force: true });
    // Menu should open up
    cy.get(".bp3-select-popover.select-popover-wrapper").should("exist");

    // Click select field in array
    cy.get(`${fieldPrefix}-array-0--select label`).click({ force: true });
    // Menu should open up
    cy.get(".bp3-select-popover.select-popover-wrapper").should("exist");
  });

  it("menu items should be selectable", () => {
    // Select field in object
    cy.get(`${fieldPrefix}-object-select label`).click({ force: true });
    // Click blue option
    cy.get(".bp3-select-popover.select-popover-wrapper")
      .find(".menu-item-text")
      .contains("Blue")
      .click({ force: true });
    // Verify if blue option is selected
    cy.get(`${fieldPrefix}-object-select .select-button`).contains("Blue");

    // Select field in array
    cy.get(`${fieldPrefix}-array-0--select label`).click({ force: true });
    // Click blue option
    cy.get(".bp3-select-popover.select-popover-wrapper")
      .find(".menu-item-text")
      .contains("Blue")
      .click({ force: true });
    // Verify if blue option is selected
    cy.get(`${fieldPrefix}-array-0--select .select-button`).contains("Blue");
  });
});

describe("JSONForm multiselect field", () => {
  before(() => {
    const schema = {
      object: {
        multiselect: "GREEN",
      },
      array: [
        {
          multiselect: "RED",
        },
      ],
    };
    cy.addDsl(dslWithoutSchema);
    cy.openPropertyPane("jsonformwidget");
    cy.testJsontext("sourcedata", JSON.stringify(schema));
    cy.openFieldConfiguration("object");
    cy.openFieldConfiguration("multiselect");
    cy.selectDropdownValue(commonlocators.jsonFormFieldType, /^Multiselect$/);

    cy.closePropertyPane();
    cy.openPropertyPane("jsonformwidget");
    cy.openFieldConfiguration("array");
    cy.openFieldConfiguration("__array_item__");
    cy.openFieldConfiguration("multiselect");
    cy.selectDropdownValue(commonlocators.jsonFormFieldType, /^Multiselect$/);
  });

  it("should open the menu", () => {
    // Open multiselect in object
    cy.get(`${fieldPrefix}-object-multiselect`)
      .find(".rc-select-selection-search-input")
      .first()
      .focus({ force: true })
      .type("{uparrow}", { force: true });

    // menu should exist in object
    cy.get(".rc-virtual-list").should("exist");

    // Open multiselect in array
    cy.get(`${fieldPrefix}-array-0--multiselect`)
      .find(".rc-select-selection-search-input")
      .first()
      .focus({ force: true })
      .type("{uparrow}", { force: true });

    // menu should exist in array
    cy.get(".rc-virtual-list").should("exist");
  });

  it("menu items should be selectable", () => {
    // Open multiselect in object
    cy.get(`${fieldPrefix}-object-multiselect`)
      .find(".rc-select-selection-search-input")
      .first()
      .focus({ force: true })
      .type("{uparrow}", { force: true });

    // select option
    cy.get(".multiselect-popover-width-object-multiselect .rc-virtual-list")
      .contains("Blue")
      .click({ force: true });

    // verify option
    cy.get(`${fieldPrefix}-object-multiselect`)
      .find(".rc-select-selector")
      .contains("Blue");

    // Open multiselect in array
    cy.get(`${fieldPrefix}-array-0--multiselect`)
      .find(".rc-select-selection-search-input")
      .first()
      .focus({ force: true })
      .type("{uparrow}", { force: true });

    // select option
    cy.get(".multiselect-popover-width-array-0--multiselect .rc-virtual-list")
      .contains("Blue")
      .click({ force: true });

    // verify option
    cy.get(`${fieldPrefix}-array-0--multiselect`)
      .find(".rc-select-selector")
      .contains("Blue");
  });
});
