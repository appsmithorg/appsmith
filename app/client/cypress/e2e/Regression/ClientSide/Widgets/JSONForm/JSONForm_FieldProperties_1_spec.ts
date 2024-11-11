import EditorNavigation, {
  EntityType,
} from "../../../../../support/Pages/EditorNavigation";

const commonlocators = require("../../../../../locators/commonlocators.json");
const widgetsLocators = require("../../../../../locators/Widgets.json");

import {
  agHelper,
  deployMode,
  entityExplorer,
  propPane,
  locators,
} from "../../../../../support/Objects/ObjectsCore";

const fieldPrefix = ".t--jsonformfield";

describe(
  "Text Field Property Control",
  { tags: ["@tag.Widget", "@tag.JSONForm", "@tag.Binding"] },
  () => {
    beforeEach(() => {
      agHelper.RestoreLocalStorageCache();
    });

    afterEach(() => {
      agHelper.SaveLocalStorageCache();
    });

    before(() => {
      const schema = {
        name: "John",
      };
      agHelper.AddDsl("jsonFormDslWithoutSchema");

      EditorNavigation.SelectEntityByName("JSONForm1", EntityType.Widget);
      propPane.EnterJSContext("Source data", JSON.stringify(schema), true);
    });

    it("1. updated field with change in default text", () => {
      // check name  has valid default text
      cy.openFieldConfiguration("name");
      cy.get(".t--property-control-defaultvalue").contains(
        "{{sourceData.name}}",
      );
      const defaultValue = "New default text";
      propPane.UpdatePropertyFieldValue("Default value", defaultValue);
      deployMode.DeployApp();
      cy.get(`${fieldPrefix}-name input`).should("have.value", defaultValue);
      deployMode.NavigateBacktoEditor();
    });

    it("2. throws max character error when exceeds maxChar limit for default text and input text", () => {
      EditorNavigation.SelectEntityByName("JSONForm1", EntityType.Widget);
      cy.openFieldConfiguration("name");
      cy.testJsontext("maxchars", 5).wait(200);
      cy.get(`${fieldPrefix}-name input`).click();
      cy.get(".bp3-popover-content").should(($x) => {
        expect($x).contain(
          "Default text length must be less than or equal to 5 characters",
        );
      });
      EditorNavigation.SelectEntityByName("JSONForm1", EntityType.Widget);
      cy.openFieldConfiguration("name");
      cy.testJsontext("maxchars", "").wait(200);
      cy.testJsontext("defaultvalue", 5).wait(200);
      cy.get(`${fieldPrefix}-name input`).clear().type("abcdefghi");
      cy.testJsontext("maxchars", 5).wait(200);
      cy.get(`${fieldPrefix}-name input`).click();
      cy.get(".bp3-popover-content").should(($x) => {
        expect($x).contain("Input text length must be less than 5 characters");
      });
      cy.testJsontext("maxchars", "");
    });

    it("3. sets placeholder", () => {
      EditorNavigation.SelectEntityByName("JSONForm1", EntityType.Widget);

      const placeholderText = "First name";
      cy.testJsontext("placeholder", placeholderText);
      deployMode.DeployApp();
      cy.get(`${fieldPrefix}-name input`)
        .invoke("attr", "placeholder")
        .should("contain", placeholderText);
      deployMode.NavigateBacktoEditor();
    });

    it("4. sets valid property with custom error message", () => {
      EditorNavigation.SelectEntityByName("JSONForm1", EntityType.Widget);
      cy.openFieldConfiguration("name");
      cy.testJsontext("valid", "false");
      deployMode.DeployApp();
      cy.get(`${fieldPrefix}-name input`).clear().type("abcd");
      cy.get(".bp3-popover-content").contains("Invalid input");
      deployMode.NavigateBacktoEditor();
      EditorNavigation.SelectEntityByName("JSONForm1", EntityType.Widget);
      cy.openFieldConfiguration("name");
      cy.testJsontext("errormessage", "Custom error message");

      deployMode.DeployApp();
      cy.get(`${fieldPrefix}-name input`).clear().type("yuru camp");
      cy.get(`${fieldPrefix}-name input`).click({ force: true });
      cy.get(".bp3-popover-content").contains("Custom error message");
      deployMode.NavigateBacktoEditor();
      EditorNavigation.SelectEntityByName("JSONForm1", EntityType.Widget);
      cy.openFieldConfiguration("name");

      // Reset the error message
      cy.testJsontext("errormessage", "");
      // Reset valid
      cy.testJsontext("valid", "");
    });

    it("5. hides field when visible switched off", () => {
      propPane.TogglePropertyState("Visible", "Off");
      deployMode.DeployApp();
      cy.get(`${fieldPrefix}-name`).should("not.exist");
      deployMode.NavigateBacktoEditor();
      EditorNavigation.SelectEntityByName("JSONForm1", EntityType.Widget);
      cy.openFieldConfiguration("name");
      propPane.TogglePropertyState("Visible", "On");
      deployMode.DeployApp();
      cy.get(`${fieldPrefix}-name`).should("exist");
      deployMode.NavigateBacktoEditor();
    });

    it("6. disables field when disabled switched on and when autofill is disabled we should see the autofill attribute in the input field", () => {
      EditorNavigation.SelectEntityByName("JSONForm1", EntityType.Widget);
      cy.openFieldConfiguration("name");
      agHelper.CheckUncheck(widgetsLocators.selectWidgetDisabled);
      deployMode.DeployApp();
      cy.get(`${fieldPrefix}-name input`).each(($el) => {
        cy.wrap($el).should("have.attr", "disabled");
      });

      deployMode.NavigateBacktoEditor();
      EditorNavigation.SelectEntityByName("JSONForm1", EntityType.Widget);
      cy.openFieldConfiguration("name");
      agHelper.CheckUncheck(widgetsLocators.selectWidgetDisabled, false);
      validateAutocompleteAttributeInJSONForm();
    });

    it("7. throws error when REGEX does not match the input value", () => {
      EditorNavigation.SelectEntityByName("JSONForm1", EntityType.Widget);
      cy.openFieldConfiguration("name");
      cy.testJsontext("regex", "^\\d+$");
      deployMode.DeployApp();
      cy.get(`${fieldPrefix}-name input`).clear().type("abcd");
      cy.get(".bp3-popover-content").contains("Invalid input");

      cy.get(`${fieldPrefix}-name input`).clear().type("1234");
      cy.get(".bp3-popover-content").should("not.exist");
      deployMode.NavigateBacktoEditor();
    });

    it("8. Checkbox Field Property Control - pre condition", () => {
      const schema = {
        check: false,
      };
      agHelper.AddDsl("jsonFormDslWithoutSchema");

      cy.openPropertyPane("jsonformwidget");
      propPane.EnterJSContext("Source data", JSON.stringify(schema), true);
      cy.openFieldConfiguration("check");
      cy.selectDropdownValue(commonlocators.jsonFormFieldType, "Checkbox");
      // check deafult property
      cy.get(".t--property-control-defaultstate").contains(
        "{{sourceData.check}}",
      );
    });

    it("9. should update field checked state when default selected changed", () => {
      //should update field checked state when default selected changed
      cy.testJsontext("defaultstate", "{{true}}");
      cy.get(`${fieldPrefix}-check input`).should("be.checked");

      // hides field when visible switched off
      agHelper.CheckUncheck(widgetsLocators.visible, false);
      deployMode.DeployApp();
      cy.get(`${fieldPrefix}-check`).should("not.exist");
      deployMode.NavigateBacktoEditor();
      EditorNavigation.SelectEntityByName("JSONForm1", EntityType.Widget);
      cy.openFieldConfiguration("check");
      agHelper.CheckUncheck(widgetsLocators.visible);
      deployMode.DeployApp();
      cy.get(`${fieldPrefix}-check`).should("exist");
      deployMode.NavigateBacktoEditor();

      // disables field when disabled switched on
      EditorNavigation.SelectEntityByName("JSONForm1", EntityType.Widget);
      cy.openFieldConfiguration("check");
      agHelper.CheckUncheck(widgetsLocators.selectWidgetDisabled);
      deployMode.DeployApp();
      cy.get(`${fieldPrefix}-check input`).each(($el) => {
        cy.wrap($el).should("have.attr", "disabled");
      });
    });
  },
);

function validateAutocompleteAttributeInJSONForm() {
  //select password input fiel
  cy.selectDropdownValue(commonlocators.jsonFormFieldType, "Password Input");

  //check if autofill toggle option is present and is checked by default
  cy.get(".t--property-control-allowautofill input").should("be.checked");
  //check if autocomplete attribute is not present in the text widget when autofill is enabled
  cy.get(`${fieldPrefix}-name input`).should("not.have.attr", "autocomplete");

  //toggle off autofill
  cy.get(".t--property-control-allowautofill input").click({ force: true });
  cy.get(".t--property-control-allowautofill input").should("not.be.checked");

  //autocomplete should now be present in the text widget
  cy.get(`${fieldPrefix}-name input`).should(
    "have.attr",
    "autocomplete",
    "off",
  );

  //select a non email or password option
  cy.selectDropdownValue(commonlocators.jsonFormFieldType, /^Text Input/);
  //autofill toggle should not be present as this restores autofill to be enabled
  cy.get(".t--property-control-allowautofill input").should("not.exist");
  //autocomplete attribute should not be present in the text widget
  cy.get(`${fieldPrefix}-name input`).should("not.have.attr", "autocomplete");
}
