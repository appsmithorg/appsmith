const commonlocators = require("../../../../../locators/commonlocators.json");
const dslWithSchema = require("../../../../../fixtures/jsonFormDslWithSchema.json");
const dslWithoutSchema = require("../../../../../fixtures/jsonFormDslWithoutSchema.json");
const widgetsPage = require("../../../../../locators/Widgets.json");
const publishPage = require("../../../../../locators/publishWidgetspage.json");

const backBtn = ".t--property-pane-back-btn";
const fieldPrefix = ".t--jsonformfield";
const propertyControlPrefix = ".t--property-control";
const submitButtonStylesSection =
  ".t--property-pane-section-submitbuttonstyles";
import { ObjectsRegistry } from "../../../../../support/Objects/Registry";
let agHelper = ObjectsRegistry.AggregateHelper;

describe("JSON Form Widget Form Bindings", () => {
  beforeEach(() => {
    agHelper.RestoreLocalStorageCache();
  });

  afterEach(() => {
    agHelper.SaveLocalStorageCache();
  });

  before(() => {
    cy.addDsl(dslWithSchema);
  });

  it("1. should have all the fields under field configuration", () => {
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

  it("2. Field Configuration - adds new custom field", () => {
    cy.openPropertyPane("jsonformwidget");

    // Add new field
    cy.get(commonlocators.jsonFormAddNewCustomFieldBtn).click({
      force: true,
    });

    // Check for the presence of newly added custom field
    cy.get(`[data-rbd-draggable-id='customField1']`).should("exist");
  });

  it("3. Disabled Invalid Forms - disables the submit button when form has invalid field(s)", () => {
    cy.get("button")
      .contains("Submit")
      .parent("button")
      .should("not.have.attr", "disabled");

    // make name field required
    cy.openFieldConfiguration("name");
    cy.togglebar(`${propertyControlPrefix}-required input`);

    cy.get(backBtn).click({ force: true });
    cy.get(`${fieldPrefix}-name input`).clear().wait(300);
    cy.get("button")
      .contains("Submit")
      .parent("button")
      .should("have.attr", "disabled");

    cy.get(`${fieldPrefix}-name input`).type("JOHN").wait(300);

    cy.get("button")
      .contains("Submit")
      .parent("button")
      .should("not.have.attr", "disabled");
  });

  it("4. Should set isValid to false when form is invalid", () => {
    cy.openPropertyPane("textwidget");
    cy.testJsontext("text", "{{JSONForm1.isValid}}");

    cy.get(`${widgetsPage.textWidget} .bp3-ui-text`).contains("true");

    cy.get(`${fieldPrefix}-name input`).clear().wait(300);

    cy.get(`${widgetsPage.textWidget} .bp3-ui-text`).contains("false");

    cy.get(`${fieldPrefix}-name input`).type("JOHN").wait(300);

    cy.get(`${widgetsPage.textWidget} .bp3-ui-text`).contains("true");
  });

  it("5. show show icon select when a collapsed section is opened", () => {
    cy.openPropertyPane("jsonformwidget");
    cy.moveToStyleTab();
    // Check Submit Button Styles hidden
    //cy.get(submitButtonStylesSection).should("not.be.visible");
    // .parent()
    // .should("have.attr", "aria-hidden", "true");
    /*
    // Open Submit Button Section
    cy.get(".t--property-pane-section-collapse-submitbuttonstyles").click({
      force: true,
    });
    */
    // Click Icon property
    cy.get(submitButtonStylesSection).contains("(none)").parent().click({
      force: true,
    });

    // Check if icon selector opened
    cy.get(".bp3-select-popover .virtuoso-grid-item").should("be.visible");
  });

  it("6. Should set isValid to false on first load when form is invalid", () => {
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

  it("7. Should set isValid to false on reset when form is invalid", () => {
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

    // Click reset button
    cy.get("button").contains("Reset").click({ force: true });
    cy.get(".t--widget-textwidget .bp3-ui-text").contains("false");

    // Type JOHN in name field
    cy.get(`${fieldPrefix}-name input`).type("JOHN");
    cy.get(".t--widget-textwidget .bp3-ui-text").contains("true");

    // Click reset button
    cy.get("button").contains("Reset").click({ force: true });
    cy.get(".t--widget-textwidget .bp3-ui-text").contains("false");

    cy.get(publishPage.backToEditor).click({ force: true });
  });

  it("8. Form value should contain hidden fields value if useSourceData is set to true", () => {
    cy.addDsl(dslWithoutSchema);

    const schema = {
      name: "",
      age: 10,
    };

    cy.openPropertyPane("jsonformwidget");
    cy.testJsontext("sourcedata", JSON.stringify(schema));

    cy.togglebar(`${propertyControlPrefix}-hiddenfieldsindata input`);

    cy.openFieldConfiguration("age");
    cy.togglebarDisable(`${propertyControlPrefix}-visible input`);

    cy.openPropertyPane("textwidget");
    cy.testJsontext("text", "{{JSON.stringify(JSONForm1.formData)}}");

    cy.get(".t--widget-textwidget .bp3-ui-text").contains(
      JSON.stringify(schema),
    );
  });

  it("9. Form value should not contain hidden fields value if useSourceData is set to false", () => {
    cy.addDsl(dslWithoutSchema);

    const name = "JOHN";

    const schema = {
      name,
      age: 10,
    };

    cy.openPropertyPane("jsonformwidget");
    cy.testJsontext("sourcedata", JSON.stringify(schema));

    cy.togglebarDisable(`${propertyControlPrefix}-hiddenfieldsindata input`);

    cy.openFieldConfiguration("age");
    cy.togglebarDisable(`${propertyControlPrefix}-visible input`);

    cy.openPropertyPane("textwidget");
    cy.testJsontext("text", "{{JSON.stringify(JSONForm1.formData)}}");

    cy.get(".t--widget-textwidget .bp3-ui-text").contains(
      JSON.stringify({ name }),
    );
  });
});
