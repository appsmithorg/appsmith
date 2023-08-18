/**
 * Spec to test the events made available by each field type
 */

const commonlocators = require("../../../../../locators/commonlocators.json");
const widgetLocators = require("../../../../../locators/Widgets.json");
import * as _ from "../../../../../support/Objects/ObjectsCore";

const fieldPrefix = ".t--jsonformfield";
const toggleJSButton = (name) => `.t--property-control-${name} .t--js-toggle`;

describe("Radio Group Field", () => {
  beforeEach(() => {
    _.agHelper.RestoreLocalStorageCache();
  });

  afterEach(() => {
    _.agHelper.SaveLocalStorageCache();
  });

  it("1. Checkbox Field - pre condition", () => {
    const schema = {
      agree: true,
    };
    _.agHelper.AddDsl("jsonFormDslWithoutSchema");
    cy.openPropertyPane("jsonformwidget");
    cy.testJsontext("sourcedata", JSON.stringify(schema));
    cy.openFieldConfiguration("agree");
    cy.selectDropdownValue(commonlocators.jsonFormFieldType, /^Checkbox/);
    cy.closePropertyPane();
  });

  it("2. Shows updated formData values in onChange binding", () => {
    cy.openPropertyPane("jsonformwidget");
    cy.openFieldConfiguration("agree");

    // Enable JS mode for onCheckChange
    cy.get(toggleJSButton("oncheckchange")).click({ force: true });

    // Add onCheckChange action
    cy.testJsontext(
      "oncheckchange",
      "{{showAlert(formData.agree.toString())}}",
    );

    // Click on select field
    cy.get(`${fieldPrefix}-agree input`).click({ force: true });

    // Check for alert
    cy.get(commonlocators.toastmsg).contains("false");
  });

  it("3. Switch Field - pre condition", () => {
    const schema = {
      agree: true,
    };
    _.agHelper.AddDsl("jsonFormDslWithoutSchema");

    cy.openPropertyPane("jsonformwidget");
    cy.testJsontext("sourcedata", JSON.stringify(schema));
    cy.closePropertyPane();
  });

  it("4. Shows updated formData values in onChange binding", () => {
    cy.openPropertyPane("jsonformwidget");
    cy.openFieldConfiguration("agree");

    // Enable JS mode for onChange
    cy.get(toggleJSButton("onchange")).click({ force: true });

    // Add onChange action
    cy.testJsontext("onchange", "{{showAlert(formData.agree.toString())}}");

    // Click on select field
    cy.get(`${fieldPrefix}-agree input`).click({ force: true });

    // Check for alert
    cy.get(commonlocators.toastmsg).contains("false");
  });

  it("5. Date Field - pre condition", () => {
    const schema = {
      dob: "20/12/1992",
    };
    _.agHelper.AddDsl("jsonFormDslWithoutSchema");

    cy.openPropertyPane("jsonformwidget");
    cy.testJsontext("sourcedata", JSON.stringify(schema));
    cy.closePropertyPane();
  });

  it("6. shows updated formData values in onDateSelected binding", () => {
    cy.openPropertyPane("jsonformwidget");
    cy.openFieldConfiguration("dob");

    // Enable JS mode for onDateSelected
    cy.get(toggleJSButton("ondateselected")).click({ force: true });

    // Add onDateSelected action
    cy.testJsontext("ondateselected", "{{showAlert(formData.dob)}}");

    // Click on select field
    cy.get(`${fieldPrefix}-dob .bp3-input`).click();
    cy.get(`${fieldPrefix}-dob .bp3-input`)
      .clear({ force: true })
      .type("10/08/2010");

    // Check for alert
    cy.contains("10/08/2010").should("be.visible");
  });
});
