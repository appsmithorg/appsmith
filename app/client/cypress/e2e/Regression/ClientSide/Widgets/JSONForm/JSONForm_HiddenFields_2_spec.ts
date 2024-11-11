import EditorNavigation, {
  EntityType,
} from "../../../../../support/Pages/EditorNavigation";

const commonlocators = require("../../../../../locators/commonlocators.json");
const widgetsPage = require("../../../../../locators/Widgets.json");

import {
  agHelper,
  entityExplorer,
  deployMode,
  propPane,
  locators,
} from "../../../../../support/Objects/ObjectsCore";

const fieldPrefix = ".t--jsonformfield";
const backBtn = "[data-testid='t--property-pane-back-btn']";

function hideAndVerifyProperties(fieldName, fieldValue, resolveFieldValue?) {
  // Check if visible
  cy.get(`${fieldPrefix}-${fieldName}`).should("exist");

  // Hide field
  propPane.TogglePropertyState("Visible", "Off");

  /**
   * When the field is hidden, post that we check if the formData has appropriate
   * changes. This checking happens immediately after the field is hidden (cy.togglebarDisable(".t--property-control-visible input")).
   * This doesn't give the widget and evaluation a chance to set the correct value.
   * cy.wait(2000) gives sufficient amount for the appropriates changes to take place.
   */
  cy.wait(3000); //wait for text field to alter

  // Check if hidden
  cy.get(`${fieldPrefix}-${fieldName}`).should("not.exist");

  // Check if key in formData is also hidden
  cy.get(`${widgetsPage.textWidget} .bp3-ui-text`).then(($el) => {
    const formData = JSON.parse($el.text());
    const formDataValue = resolveFieldValue
      ? resolveFieldValue(formData)
      : formData[fieldName];

    cy.wrap(formDataValue).should("be.undefined");
  });

  // Show field
  agHelper.CheckUncheck(widgetsPage.visible);

  // Check if visible
  cy.get(`${fieldPrefix}-${fieldName}`).should("exist");

  cy.wait(3000); //wait for text field to alter

  // Check if key in formData is also hidden
  cy.get(`${widgetsPage.textWidget} .bp3-ui-text`).then(($el) => {
    const formData = JSON.parse($el.text());
    const formDataValue = resolveFieldValue
      ? resolveFieldValue(formData)
      : formData[fieldName];

    cy.wrap(formDataValue).should("deep.equal", fieldValue);
  });

  cy.closePropertyPane();
}

function changeFieldType(fieldName, fieldType) {
  cy.openFieldConfiguration(fieldName);
  cy.selectDropdownValue(commonlocators.jsonFormFieldType, fieldType);
}

function addCustomField(fieldType) {
  cy.openPropertyPane("jsonformwidget");
  cy.get(".t--property-control-sourcedata")
    .find(".t--js-toggle")
    .click({ force: true });
  cy.backFromPropertyPanel();

  // Add new field
  cy.get(commonlocators.jsonFormAddNewCustomFieldBtn).click({
    force: true,
  });

  changeFieldType("customField1", fieldType);
}

function removeCustomField() {
  cy.openPropertyPane("jsonformwidget");
  cy.deleteJSONFormField("customField1");
}

describe(
  "JSON Form Hidden fields",
  { tags: ["@tag.Widget", "@tag.JSONForm", "@tag.Binding"] },
  () => {
    before(() => {
      agHelper.AddDsl("jsonFormDslWithSchema");
      cy.openPropertyPane("jsonformwidget");
      cy.get(locators._jsToggle("sourcedata")).click({ force: true });
      EditorNavigation.SelectEntityByName("Text1", EntityType.Widget);
      propPane.UpdatePropertyFieldValue(
        "Text",
        "{{JSON.stringify(JSONForm1.formData)}}",
      );
    });

    it("1. can hide Phone Number Input Field", () => {
      const defaultValue = "1000";
      // Add new custom field
      addCustomField("Phone Number Input");

      cy.testJsontext("defaultvalue", defaultValue);

      hideAndVerifyProperties("customField1", defaultValue);

      removeCustomField();
    });

    it("2. can hide Radio Group Field", () => {
      const defaultValue = "Y";
      // Add new custom field
      addCustomField("Phone Number Input");

      cy.testJsontext("defaultvalue", defaultValue);

      hideAndVerifyProperties("customField1", defaultValue);

      removeCustomField();
    });

    it("3. can hide Select Field", () => {
      const defaultValue = "BLUE";
      // Add new custom field
      addCustomField(/^Select/);

      cy.testJsontext("defaultselectedvalue", defaultValue);

      hideAndVerifyProperties("customField1", defaultValue);

      removeCustomField();
    });

    it("4. can hide Switch Field", () => {
      // Add new custom field
      addCustomField("Switch");

      hideAndVerifyProperties("customField1", true);

      removeCustomField();
    });

    it("5. hides fields on first load", () => {
      cy.openPropertyPane("jsonformwidget");

      // hide education field
      cy.openFieldConfiguration("education");
      agHelper.CheckUncheck(widgetsPage.visible, false);
      cy.get(backBtn).click({ force: true }).wait(500);
      // hide name field
      cy.openFieldConfiguration("name");
      agHelper.CheckUncheck(widgetsPage.visible, false);

      // publish the app
      deployMode.DeployApp();
      cy.wait(4000);

      // Check if name is hidden
      cy.get(`${fieldPrefix}-name`).should("not.exist");
      // Check if education is hidden
      cy.get(`${fieldPrefix}-education`).should("not.exist");

      // check if name and education are not present in form data
      cy.get(".t--widget-textwidget .bp3-ui-text").then(($el) => {
        const formData = JSON.parse($el.text());

        cy.wrap(formData.name).should("deep.equal", undefined);
        cy.wrap(formData.education).should("deep.equal", undefined);
      });
    });
  },
);
