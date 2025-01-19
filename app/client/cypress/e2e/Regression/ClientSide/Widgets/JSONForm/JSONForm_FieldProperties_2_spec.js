import EditorNavigation, {
  EntityType,
} from "../../../../../support/Pages/EditorNavigation";

const commonlocators = require("../../../../../locators/commonlocators.json");
const widgetsLocators = require("../../../../../locators/Widgets.json");

import {
  agHelper,
  entityExplorer,
  deployMode,
  propPane,
  locators,
} from "../../../../../support/Objects/ObjectsCore";

const fieldPrefix = ".t--jsonformfield";

describe(
  "Text Field Property Control",
  { tags: ["@tag.All", "@tag.JSONForm", "@tag.Binding"] },
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
      cy.openPropertyPane("jsonformwidget");
      propPane.EnterJSContext("Source data", JSON.stringify(schema), true);
    });

    it("1. Switch Field Property Control - pre condition", () => {
      const schema = {
        switch: true,
      };
      agHelper.AddDsl("jsonFormDslWithoutSchema");

      cy.openPropertyPane("jsonformwidget");
      propPane.EnterJSContext("Source data", JSON.stringify(schema), true);
      cy.openFieldConfiguration("switch");
      // assert default property
      cy.get(".t--property-control-defaultselected").contains(
        "{{sourceData.switch}}",
      );
    });

    it("2. should update field checked state when default selected changed", () => {
      cy.testJsontext("defaultselected", "{{false}}");
      deployMode.DeployApp();
      cy.get(`${fieldPrefix}-switch label.bp3-control.bp3-switch`).should(
        "have.class",
        "t--switch-widget-inactive",
      );
      entityExplorer.dra;
      deployMode.NavigateBacktoEditor();
    });

    it("3. hides field when visible switched off", () => {
      EditorNavigation.SelectEntityByName("JSONForm1", EntityType.Widget);
      cy.openFieldConfiguration("switch");
      propPane.TogglePropertyState("Visible", "Off");
      deployMode.DeployApp();
      cy.get(`${fieldPrefix}-switch`).should("not.exist");
      deployMode.NavigateBacktoEditor();
      EditorNavigation.SelectEntityByName("JSONForm1", EntityType.Widget);
      cy.openFieldConfiguration("switch");
      propPane.TogglePropertyState("Visible", "On");
      deployMode.DeployApp();
      cy.get(`${fieldPrefix}-switch`).should("exist");
      deployMode.NavigateBacktoEditor();
    });

    it("4. disables field when disabled switched on", () => {
      EditorNavigation.SelectEntityByName("JSONForm1", EntityType.Widget);
      cy.openFieldConfiguration("switch");
      propPane.TogglePropertyState("Disabled", "On");
      deployMode.DeployApp();
      cy.get(`${fieldPrefix}-switch input`).each(($el) => {
        cy.wrap($el).should("have.attr", "disabled");
      });

      deployMode.NavigateBacktoEditor();
      EditorNavigation.SelectEntityByName("JSONForm1", EntityType.Widget);
      cy.openFieldConfiguration("switch");
      propPane.TogglePropertyState("Disabled", "Off");
    });

    it("5. Select Field Property Control - pre condition", () => {
      const schema = {
        state: "Karnataka",
      };
      agHelper.AddDsl("jsonFormDslWithoutSchema");

      cy.openPropertyPane("jsonformwidget");
      propPane.EnterJSContext("Source data", JSON.stringify(schema), true);

      cy.openFieldConfiguration("state");
      cy.selectDropdownValue(commonlocators.jsonFormFieldType, /^Select/);
      // assert valid default value
      cy.get(".t--property-control-defaultselectedvalue").contains(
        "{{sourceData.state}}",
      );
    });

    it("6. makes select filterable", () => {
      // click select field and filter input should not exist
      cy.get(`${fieldPrefix}-state .bp3-control-group`).click({ force: true });
      cy.get(`.bp3-select-popover .bp3-input-group`).should("not.exist");

      // toggle filterable -> true in property pane
      agHelper.CheckUncheck(commonlocators.allowsearchingInput);

      deployMode.DeployApp();

      // click select field and filter input should exist
      cy.get(`${fieldPrefix}-state .bp3-control-group`).click({ force: true });
      cy.get(`.bp3-select-popover .bp3-input-group`).should("exist");
      deployMode.NavigateBacktoEditor();
    });

    it("7. Multi Field Property Control - pre condition", () => {
      const schema = {
        hobbies: [],
      };
      agHelper.AddDsl("jsonFormDslWithoutSchema");

      cy.openPropertyPane("jsonformwidget");
      propPane.EnterJSContext("Source data", JSON.stringify(schema), true);
      cy.openFieldConfiguration("hobbies");
      // assert valid default value
      cy.get(".t--property-control-defaultselectedvalues").contains(
        "{{sourceData.hobbies}}",
      );
      cy.closePropertyPane();
    });

    it("8. adds placeholder text", () => {
      cy.openPropertyPane("jsonformwidget");
      cy.openFieldConfiguration("hobbies");

      cy.testJsontext("placeholder", "Select placeholder");
      deployMode.DeployApp();
      cy.get(`.rc-select-selection-placeholder`).contains("Select placeholder");
      deployMode.NavigateBacktoEditor();
    });

    it("9. Invalid options should not crash the widget", () => {
      EditorNavigation.SelectEntityByName("JSONForm1", EntityType.Widget);
      cy.openFieldConfiguration("hobbies");
      // clear Options
      cy.testJsonTextClearMultiline("options");
      // enter invalid options
      cy.testJsontext("options", '{{[{ label: "asd", value: "zxc"}, null ]}}');

      // wait for eval to update
      cy.wait(2000);
      // Check if the multiselect field exist
      cy.get(`${fieldPrefix}-hobbies`).should("exist");

      // clear Default Selected Values
      cy.testJsonTextClearMultiline("defaultselectedvalues");
      // enter default value
      cy.testJsontext("defaultselectedvalues", '["zxc"]');

      // wait for eval to update
      cy.wait(2000);
      // Check if the multiselect field exist
      cy.get(`${fieldPrefix}-hobbies`).should("exist");
    });

    it("10. Radio group Field Property Control - pre condition", () => {
      const sourceData = {
        radio: "Y",
      };
      agHelper.AddDsl("jsonFormDslWithoutSchema");

      cy.openPropertyPane("jsonformwidget");
      propPane.EnterJSContext("Source data", JSON.stringify(sourceData), true);

      cy.openFieldConfiguration("radio");
      cy.selectDropdownValue(commonlocators.jsonFormFieldType, "Radio Group");
      // assert valid default value
      cy.get(".t--property-control-defaultselectedvalue").contains(
        "{{sourceData.radio}}",
      );

      cy.get(`${fieldPrefix}-radio input`).should("have.value", "Y");

      // hides field when visible switched off"
      agHelper.CheckUncheck(widgetsLocators.visible, false);
      cy.get(`${fieldPrefix}-radio`).should("not.exist");
      cy.wait(500);
      agHelper.CheckUncheck(widgetsLocators.visible);
      cy.get(`${fieldPrefix}-radio`).should("exist");
    });
  },
);
