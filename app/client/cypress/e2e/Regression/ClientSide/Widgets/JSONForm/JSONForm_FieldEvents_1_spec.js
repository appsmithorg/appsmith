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

  it("1. Radio Group Field - pre condition", () => {
    const schema = {
      answer: "Y",
    };
    _.agHelper.AddDsl("jsonFormDslWithoutSchema");
    cy.openPropertyPane("jsonformwidget");
    cy.testJsontext("sourcedata", JSON.stringify(schema));
    cy.openFieldConfiguration("answer");
    cy.selectDropdownValue(commonlocators.jsonFormFieldType, "Radio Group");
    cy.closePropertyPane();
  });

  it("2. shows alert on optionChange", () => {
    cy.openPropertyPane("jsonformwidget");
    cy.openFieldConfiguration("answer");

    // Enable JS mode for onSelectionChange
    cy.get(toggleJSButton("onselectionchange")).click({ force: true });

    // Add onSelectionChange action
    cy.testJsontext("onselectionchange", "{{showAlert(formData.answer)}}");

    cy.get(`${fieldPrefix}-answer`)
      .find("label")
      .contains("No")
      .click({ force: true });

    // Check for alert
    cy.get(commonlocators.toastmsg).contains("N");
  });

  it("3. Multiselect Field - pre condition", () => {
    const schema = {
      colors: ["BLUE"],
    };
    _.agHelper.AddDsl("jsonFormDslWithoutSchema");
    cy.openPropertyPane("jsonformwidget");
    cy.testJsontext("sourcedata", JSON.stringify(schema));
    cy.closePropertyPane();
  });

  it("4. Shows updated formData values in onOptionChange binding", () => {
    cy.openPropertyPane("jsonformwidget");
    cy.openFieldConfiguration("colors");

    // Enable JS mode for onOptionChange
    cy.get(toggleJSButton("onoptionchange")).click({ force: true });

    // Add onOptionChange action
    cy.testJsontext(
      "onoptionchange",
      "{{showAlert(formData.colors.join(', '))}}",
    );

    // Click on multiselect field
    cy.get(`${fieldPrefix}-colors`)
      .find(".rc-select-selection-search-input")
      .first()
      .focus({ force: true })
      .type("{uparrow}", { force: true });
    cy.dropdownMultiSelectDynamic("Red");

    // Check for alert
    cy.get(commonlocators.toastmsg).contains("BLUE, RED");
  });

  it("5. Select Field - pre condition", () => {
    const schema = {
      color: "BLUE",
    };
    _.agHelper.AddDsl("jsonFormDslWithoutSchema");
    cy.openPropertyPane("jsonformwidget");
    cy.testJsontext("sourcedata", JSON.stringify(schema));
    cy.openFieldConfiguration("color");
    cy.selectDropdownValue(commonlocators.jsonFormFieldType, /^Select/);
    cy.closePropertyPane();
  });

  it("6. shows updated formData values in onOptionChange binding", () => {
    cy.openPropertyPane("jsonformwidget");
    cy.openFieldConfiguration("color");

    // Enable JS mode for onOptionChange
    cy.get(toggleJSButton("onoptionchange")).click({ force: true });

    // Add onOptionChange action
    cy.testJsontext("onoptionchange", "{{showAlert(formData.color)}}");

    // Click on select field
    cy.get(`${fieldPrefix}-color`)
      .find(widgetLocators.dropdownSingleSelect)
      .click({ force: true });

    // Select "Red" option
    cy.get(commonlocators.singleSelectWidgetMenuItem)
      .contains("Red")
      .click({ force: true });

    // Check for alert
    cy.get(commonlocators.toastmsg).contains("RED");
  });

  it("7. Input Field - pre condition", () => {
    const schema = {
      name: "John",
    };
    _.agHelper.AddDsl("jsonFormDslWithoutSchema");
    cy.openPropertyPane("jsonformwidget");
    cy.testJsontext("sourcedata", JSON.stringify(schema));
    cy.closePropertyPane();
  });

  it("8. Shows updated formData values in onOptionChange binding", () => {
    cy.openPropertyPane("jsonformwidget");
    cy.openFieldConfiguration("name");

    // Enable JS mode for onTextChanged
    cy.get(toggleJSButton("ontextchanged")).click({ force: true });

    // Add onTextChanged action
    cy.testJsontext("ontextchanged", "{{showAlert(formData.name)}}");

    // Change input value
    cy.get(`${fieldPrefix}-name`).click();
    cy.get(`${fieldPrefix}-name`).type(" Doe");

    // Check for alert
    cy.get(commonlocators.toastmsg).contains("John Doe");
  });
});
