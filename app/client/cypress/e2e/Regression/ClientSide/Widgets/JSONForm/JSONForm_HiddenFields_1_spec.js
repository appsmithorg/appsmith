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

function hideAndVerifyProperties(fieldName, fieldValue, resolveFieldValue) {
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

    it("1. can hide Array Field", () => {
      EditorNavigation.SelectEntityByName("JSONForm1", EntityType.Widget);
      propPane.OpenJsonFormFieldSettings("Education");
      hideAndVerifyProperties("education", [
        {
          college: "MIT",
          year: "20/10/2014",
        },
      ]);
    });

    it("2. can hide Array Field's inner fields", () => {
      cy.openPropertyPane("jsonformwidget");
      cy.openFieldConfiguration("education");
      cy.openFieldConfiguration("__array_item__", false);
      cy.openFieldConfiguration("college", false);

      hideAndVerifyProperties("education-0--college", "MIT", (formData) => {
        return formData.education[0].college;
      });
    });

    it("3. can hide Checkbox Field", () => {
      // Add new custom field
      addCustomField("Checkbox");

      hideAndVerifyProperties("customField1", true);
      // Remove custom field
      removeCustomField();
    });

    it("4. can hide Currency Field", () => {
      const defaultValue = 1000;
      // Add new custom field
      addCustomField("Currency Input");
      cy.testJsontext("defaultvalue", defaultValue);
      hideAndVerifyProperties("customField1", defaultValue);
      removeCustomField();
    });

    it("5. can hide Date Field", () => {
      cy.openPropertyPane("jsonformwidget");
      cy.openFieldConfiguration("dob");

      hideAndVerifyProperties("dob", "10/12/1992");
    });

    it("6. can hide Input Field", () => {
      cy.openPropertyPane("jsonformwidget");
      cy.openFieldConfiguration("name");

      hideAndVerifyProperties("name", "John");
    });

    it("7. can hide Multiselect Field", () => {
      cy.openPropertyPane("jsonformwidget");
      cy.openFieldConfiguration("hobbies");

      hideAndVerifyProperties("hobbies", ["travelling", "swimming"]);
    });

    it("8. can hide Object Field", () => {
      cy.openPropertyPane("jsonformwidget");
      cy.openFieldConfiguration("address");

      hideAndVerifyProperties("address", {
        street: "Koramangala",
        city: "Bangalore",
      });
    });
  },
);
