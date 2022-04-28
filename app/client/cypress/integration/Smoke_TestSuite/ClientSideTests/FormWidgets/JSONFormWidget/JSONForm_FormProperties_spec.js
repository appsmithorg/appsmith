const commonlocators = require("../../../../../locators/commonlocators.json");
const dslWithSchema = require("../../../../../fixtures/jsonFormDslWithSchema.json");
const dslWithoutSchema = require("../../../../../fixtures/jsonFormDslWithoutSchema.json");
const widgetsPage = require("../../../../../locators/Widgets.json");
const publishPage = require("../../../../../locators/publishWidgetspage.json");

const backBtn = ".t--property-pane-back-btn";
const fieldPrefix = ".t--jsonformfield";
const propertyControlPrefix = ".t--property-control";

describe("JSON Form Widget Form Bindings", () => {
  before(() => {
    cy.addDsl(dslWithSchema);
  });

  it("should have all the fields under field configuration", () => {
    cy.openPropertyPane("jsonformwidget");
    const fieldNames = [
      "name",
      "age",
      "dob",
      "migrant",
      "address",
      "education",
      "hobbies",
    ];

    fieldNames.forEach((fieldName) => {
      cy.get(`[data-rbd-draggable-id='${fieldName}']`).should("exist");
    });
  });

  it("Field Configuration - adds new custom field", () => {
    cy.openPropertyPane("jsonformwidget");

    // Add new field
    cy.get(commonlocators.jsonFormAddNewCustomFieldBtn).click({
      force: true,
    });

    // Check for the presence of newly added custom field
    cy.get(`[data-rbd-draggable-id='customField1']`).should("exist");
  });

  it("Disabled Invalid Forms - disables the submit button when form has invalid field(s)", () => {
    cy.get("button")
      .contains("Submit")
      .parent("button")
      .should("not.have.attr", "disabled");

    // make name field required
    cy.openFieldConfiguration("name");
    cy.togglebar(`${propertyControlPrefix}-required input`);

    cy.get(backBtn).click({ force: true });
    cy.get(`${fieldPrefix}-name input`)
      .clear()
      .wait(300);
    cy.get("button")
      .contains("Submit")
      .parent("button")
      .should("have.attr", "disabled");

    cy.get(`${fieldPrefix}-name input`)
      .type("JOHN")
      .wait(300);

    cy.get("button")
      .contains("Submit")
      .parent("button")
      .should("not.have.attr", "disabled");
  });

  it("Should set isValid to false when form is invalid", () => {
    cy.openPropertyPane("textwidget");
    cy.testJsontext("text", "{{JSONForm1.isValid}}");

    cy.get(`${widgetsPage.textWidget} .bp3-ui-text`).contains("true");

    cy.get(`${fieldPrefix}-name input`)
      .clear()
      .wait(300);

    cy.get(`${widgetsPage.textWidget} .bp3-ui-text`).contains("false");

    cy.get(`${fieldPrefix}-name input`)
      .type("JOHN")
      .wait(300);

    cy.get(`${widgetsPage.textWidget} .bp3-ui-text`).contains("true");
  });

  it("Should set isValid to false on first load when form is invalid", () => {
    cy.addDsl(dslWithoutSchema);

    const schema = {
      name: "",
    };

    cy.openPropertyPane("textwidget");
    cy.testJsontext("text", "{{JSONForm1.isValid}}");

    cy.openPropertyPane("jsonformwidget");
    cy.testJsontext("sourcedata", JSON.stringify(schema));

    // make name field required
    cy.openFieldConfiguration("name");
    cy.togglebar(`${propertyControlPrefix}-required input`);

    cy.PublishtheApp();

    cy.get(".t--widget-textwidget .bp3-ui-text").contains("false");

    cy.get(publishPage.backToEditor).click({ force: true });
  });
});
