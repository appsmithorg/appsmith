import EditorNavigation, {
  EntityType,
} from "../../../../../support/Pages/EditorNavigation";

const commonlocators = require("../../../../../locators/commonlocators.json");
const dslWithSchema = require("../../../../../fixtures/jsonFormDslWithSchema.json");
const dslWithoutSchema = require("../../../../../fixtures/jsonFormDslWithoutSchema.json");
const widgetsPage = require("../../../../../locators/Widgets.json");

const backBtn = "[data-testid='t--property-pane-back-btn']";
const fieldPrefix = ".t--jsonformfield";
const propertyControlPrefix = ".t--property-control";
const submitButtonStylesSection =
  ".t--property-pane-section-submitbuttonstyles";
import {
  agHelper,
  deployMode,
  entityExplorer,
  propPane,
  locators,
} from "../../../../../support/Objects/ObjectsCore";

describe(
  "JSON Form Widget Form Bindings",
  { tags: ["@tag.Widget", "@tag.JSONForm", "@tag.Binding"] },
  () => {
    beforeEach(() => {
      agHelper.RestoreLocalStorageCache();
    });

    afterEach(() => {
      agHelper.SaveLocalStorageCache();
    });

    before("Add dsl and check fields under field configuration", () => {
      cy.addDsl(dslWithSchema);
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

    it("1. Field Configuration - adds new custom field", () => {
      cy.openPropertyPane("jsonformwidget");

      // Add new field
      cy.get(commonlocators.jsonFormAddNewCustomFieldBtn).click({
        force: true,
      });

      deployMode.DeployApp();
      // Check for the presence of newly added custom field
      cy.get(`.t--jsonformfield-customField1`).should("exist");

      deployMode.NavigateBacktoEditor();
    });

    it("2. Disable when form is invalid - disables the submit button when form has invalid field(s)", () => {
      EditorNavigation.SelectEntityByName("JSONForm1", EntityType.Widget);

      cy.get("button")
        .contains("Submit")
        .parent("button")
        .should("not.have.attr", "disabled");

      // make name field required
      cy.openFieldConfiguration("name");
      propPane.TogglePropertyState("Required", "On");
      deployMode.DeployApp();

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
      deployMode.NavigateBacktoEditor();
    });

    it("3. Should set isValid to false when form is invalid", () => {
      EditorNavigation.SelectEntityByName("JSONForm1", EntityType.Widget);
      cy.openPropertyPane("textwidget");
      cy.testJsontext("text", "{{JSONForm1.isValid}}");
      cy.get(`${widgetsPage.textWidget} .bp3-ui-text`).contains("true");
      cy.get(`${fieldPrefix}-name input`).clear().wait(300);
      cy.get(`${widgetsPage.textWidget} .bp3-ui-text`).contains("false");
      cy.get(`${fieldPrefix}-name input`).type("JOHN").wait(300);
      cy.get(`${widgetsPage.textWidget} .bp3-ui-text`).contains("true");
    });

    it("4. show show icon select when a collapsed section is opened", () => {
      cy.openPropertyPane("jsonformwidget");
      cy.moveToStyleTab();

      // Click Icon property
      cy.get(submitButtonStylesSection).contains("(none)").parent().click({
        force: true,
      });

      // Check if icon selector opened
      cy.get(".bp3-select-popover .virtuoso-grid-item").should("be.visible");
    });

    it("5. Should set isValid to false on first load when form is invalid", () => {
      cy.addDsl(dslWithoutSchema);

      const schema = {
        name: "",
      };

      cy.openPropertyPane("textwidget");
      cy.testJsontext("text", "{{JSONForm1.isValid}}");

      cy.openPropertyPane("jsonformwidget");
      propPane.EnterJSContext("Source data", JSON.stringify(schema), true);

      // make name field required
      cy.openFieldConfiguration("name");
      agHelper.CheckUncheck(`${propertyControlPrefix}-required input`);

      deployMode.DeployApp();

      cy.get(".t--widget-textwidget .bp3-ui-text").contains("false");

      deployMode.NavigateBacktoEditor();
    });

    it("6. Should set isValid to false on reset when form is invalid", () => {
      cy.addDsl(dslWithoutSchema);

      const schema = {
        name: "",
      };

      cy.openPropertyPane("textwidget");
      cy.testJsontext("text", "{{JSONForm1.isValid}}");

      cy.openPropertyPane("jsonformwidget");
      propPane.EnterJSContext("Source data", JSON.stringify(schema), true);

      // make name field required
      cy.openFieldConfiguration("name");
      agHelper.CheckUncheck(`${propertyControlPrefix}-required input`);

      deployMode.DeployApp();

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

      deployMode.NavigateBacktoEditor();
    });

    it("7. Form value should contain hidden fields value if useSourceData is set to true", () => {
      cy.addDsl(dslWithoutSchema);

      const schema = {
        name: "",
        age: 10,
      };

      cy.openPropertyPane("jsonformwidget");
      propPane.EnterJSContext("Source data", JSON.stringify(schema), true);

      agHelper.CheckUncheck(
        `${propertyControlPrefix}-hiddenfieldsindata input`,
      );

      cy.openFieldConfiguration("age");
      agHelper.CheckUncheck(`${propertyControlPrefix}-visible input`, false);

      cy.openPropertyPane("textwidget");
      cy.testJsontext("text", "{{JSON.stringify(JSONForm1.formData)}}");

      cy.get(".t--widget-textwidget .bp3-ui-text").contains(
        JSON.stringify(schema),
      );
    });

    it("8. Form value should not contain hidden fields value if useSourceData is set to false", () => {
      cy.addDsl(dslWithoutSchema);

      const name = "JOHN";

      const schema = {
        name,
        age: 10,
      };

      cy.openPropertyPane("jsonformwidget");
      propPane.EnterJSContext("Source data", JSON.stringify(schema), true);

      agHelper.CheckUncheck(
        `${propertyControlPrefix}-hiddenfieldsindata input`,
        false,
      );

      cy.openFieldConfiguration("age");
      agHelper.CheckUncheck(`${propertyControlPrefix}-visible input`, false);

      cy.openPropertyPane("textwidget");
      cy.testJsontext("text", "{{JSON.stringify(JSONForm1.formData)}}");

      cy.get(".t--widget-textwidget .bp3-ui-text").contains(
        JSON.stringify({ name }),
      );
    });
  },
);
