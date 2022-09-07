const commonlocators = require("../../../../../locators/commonlocators.json");
const dslWithSchema = require("../../../../../fixtures/jsonFormDslWithSchema.json");

const fieldPrefix = ".t--jsonformfield";

describe("JSON Form Widget Field Change", () => {
  before(() => {
    cy.addDsl(dslWithSchema);
  });

  it("modifies field type text to number", () => {
    cy.openPropertyPane("jsonformwidget");

    cy.get(`${fieldPrefix}-name`)
      .find("button")
      .should("not.exist");
    cy.openFieldConfiguration("name");
    cy.selectDropdownValue(commonlocators.jsonFormFieldType, "Number Input");
    cy.get(`${fieldPrefix}-name`)
      .find("button")
      .should("have.length", 2);
    cy.selectDropdownValue(commonlocators.jsonFormFieldType, /^Text Input/);
    cy.closePropertyPane();
  });

  it("modifies field type text to checkbox", () => {
    cy.openPropertyPane("jsonformwidget");

    cy.get(`${fieldPrefix}-name`)
      .find("input")
      .invoke("attr", "type")
      .should("contain", "text");
    cy.openFieldConfiguration("name");
    cy.selectDropdownValue(commonlocators.jsonFormFieldType, "Checkbox");
    cy.get(`${fieldPrefix}-name`)
      .find("input")
      .invoke("attr", "type")
      .should("contain", "checkbox");
    cy.selectDropdownValue(commonlocators.jsonFormFieldType, /^Text Input/);
    cy.closePropertyPane();
  });

  it("modifies field type text to date", () => {
    cy.openPropertyPane("jsonformwidget");

    cy.get(`${fieldPrefix}-name`)
      .find("input")
      .click({ force: true });
    cy.get(".bp3-popover.bp3-dateinput-popover").should("not.exist");
    cy.openFieldConfiguration("name");
    cy.selectDropdownValue(commonlocators.jsonFormFieldType, "Datepicker");
    cy.get(`${fieldPrefix}-name`)
      .find("input")
      .click({ force: true });
    cy.get(".bp3-popover.bp3-dateinput-popover").should("exist");
    cy.selectDropdownValue(commonlocators.jsonFormFieldType, /^Text Input/);
    cy.closePropertyPane();
  });

  it("modifies field type text to switch", () => {
    cy.openPropertyPane("jsonformwidget");

    cy.get(`${fieldPrefix}-name`)
      .find(".bp3-control.bp3-switch")
      .should("not.exist");

    cy.openFieldConfiguration("name");
    cy.selectDropdownValue(commonlocators.jsonFormFieldType, "Switch");

    cy.get(`${fieldPrefix}-name`)
      .find(".bp3-control.bp3-switch")
      .should("exist");

    cy.selectDropdownValue(commonlocators.jsonFormFieldType, /^Text Input/);
    cy.closePropertyPane();
  });

  it("modifies field type text to Select", () => {
    cy.openPropertyPane("jsonformwidget");

    cy.get(`${fieldPrefix}-name label`).click({ force: true });
    cy.get(".bp3-select-popover.select-popover-wrapper").should("not.exist");

    cy.openFieldConfiguration("name");
    cy.selectDropdownValue(commonlocators.jsonFormFieldType, /^Select/);

    cy.get(`${fieldPrefix}-name label`).click({ force: true });
    cy.get(".bp3-select-popover.select-popover-wrapper").should("exist");

    cy.selectDropdownValue(commonlocators.jsonFormFieldType, /^Text Input/);
    cy.closePropertyPane();
  });

  it("modifies field type text to Multi-Select", () => {
    cy.openPropertyPane("jsonformwidget");

    cy.get(`${fieldPrefix}-name`)
      .find(".rc-select-multiple")
      .should("not.exist");

    cy.openFieldConfiguration("name");
    cy.selectDropdownValue(commonlocators.jsonFormFieldType, "Multiselect");
    cy.get(`${fieldPrefix}-name`)
      .find(".rc-select-multiple")
      .should("exist");

    cy.selectDropdownValue(commonlocators.jsonFormFieldType, /^Text Input/);
    cy.closePropertyPane();
  });

  it("modifies field type text to Radio-Group", () => {
    cy.openPropertyPane("jsonformwidget");

    cy.get(`${fieldPrefix}-name`)
      .find(".bp3-control.bp3-radio")
      .should("not.exist");

    cy.openFieldConfiguration("name");
    cy.selectDropdownValue(commonlocators.jsonFormFieldType, "Radio Group");
    cy.get(`${fieldPrefix}-name`)
      .find(".bp3-control.bp3-radio")
      .should("exist")
      .should("have.length", 2);

    cy.selectDropdownValue(commonlocators.jsonFormFieldType, /^Text Input/);
    cy.closePropertyPane();
  });

  it("modifies field type text to Array", () => {
    cy.openPropertyPane("jsonformwidget");

    cy.get(`${fieldPrefix}-name`)
      .find(".t--jsonformfield-array-add-btn")
      .should("not.exist");

    cy.openFieldConfiguration("name");
    cy.selectDropdownValue(commonlocators.jsonFormFieldType, "Array");
    cy.get(`${fieldPrefix}-name`)
      .find(".t--jsonformfield-array-add-btn")
      .should("exist");

    cy.selectDropdownValue(commonlocators.jsonFormFieldType, /^Text Input/);
    cy.closePropertyPane();
  });

  it("modifies field type text to Object", () => {
    cy.openPropertyPane("jsonformwidget");

    cy.openFieldConfiguration("name");
    cy.selectDropdownValue(commonlocators.jsonFormFieldType, "Object");
    cy.get(`${fieldPrefix}-name`)
      .find("input")
      .should("not.exist");

    cy.get(commonlocators.jsonFormAddNewCustomFieldBtn).click({
      force: true,
    });

    cy.get(`${fieldPrefix}-name`)
      .find("input")
      .should("exist");

    cy.selectDropdownValue(commonlocators.jsonFormFieldType, /^Text Input/);
    cy.closePropertyPane();
  });

  it("modifies field type Multi-Select to Array", () => {
    cy.openPropertyPane("jsonformwidget");

    cy.get(`${fieldPrefix}-hobbies`)
      .find(".rc-select-multiple")
      .should("exist");

    cy.openFieldConfiguration("hobbies");
    cy.selectDropdownValue(commonlocators.jsonFormFieldType, "Array");
    cy.get(`${fieldPrefix}-hobbies`).then((hobbies) => {
      cy.wrap(hobbies)
        .find(".t--jsonformfield-array-add-btn")
        .should("exist");
      cy.wrap(hobbies)
        .find("input")
        .should("have.length", 2);
      cy.wrap(hobbies)
        .find(".t--jsonformfield-array-delete-btn")
        .should("have.length", 2);
    });

    cy.selectDropdownValue(commonlocators.jsonFormFieldType, /^Text Input/);
    cy.closePropertyPane();
  });
});
