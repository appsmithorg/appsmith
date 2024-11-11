/**
 * Spec to test the events made available by each field type
 */
import EditorNavigation, {
  EntityType,
} from "../../../../../support/Pages/EditorNavigation";

const commonlocators = require("../../../../../locators/commonlocators.json");
import {
  agHelper,
  deployMode,
  entityExplorer,
  propPane,
  locators,
} from "../../../../../support/Objects/ObjectsCore";

const fieldPrefix = ".t--jsonformfield";
const toggleJSButton = (name) => `.t--property-control-${name} .t--js-toggle`;

describe(
  "Radio Group Field",
  { tags: ["@tag.Widget", "@tag.JSONForm", "@tag.Binding"] },
  () => {
    beforeEach(() => {
      agHelper.RestoreLocalStorageCache();
    });

    afterEach(() => {
      agHelper.SaveLocalStorageCache();
    });

    it("1. Shows updated formData values in onChange binding", () => {
      const schema = {
        agree: true,
      };
      agHelper.AddDsl("jsonFormDslWithoutSchema");
      EditorNavigation.SelectEntityByName("JSONForm1", EntityType.Widget);
      propPane.EnterJSContext("Source data", JSON.stringify(schema), true);

      cy.openFieldConfiguration("agree");
      cy.selectDropdownValue(commonlocators.jsonFormFieldType, /^Checkbox/);

      propPane.EnterJSContext(
        "onCheckChange",
        "{{showAlert(formData.agree.toString())}}",
      );
      deployMode.DeployApp();
      // Click on select field
      cy.get(`${fieldPrefix}-agree input`).click({ force: true });

      // Check for alert
      cy.get(commonlocators.toastmsg).contains("false");

      deployMode.NavigateBacktoEditor();
    });

    it("2. Shows updated formData values in onChange binding", () => {
      const schema = {
        agree: true,
      };

      agHelper.AddDsl("jsonFormDslWithoutSchema");
      EditorNavigation.SelectEntityByName("JSONForm1", EntityType.Widget);
      propPane.EnterJSContext("Source data", JSON.stringify(schema), true);

      cy.openFieldConfiguration("agree");

      propPane.EnterJSContext(
        "onChange",
        "{{showAlert(formData.agree.toString())}}",
      );

      deployMode.DeployApp();
      // Click on select field
      cy.get(`${fieldPrefix}-agree input`).click({ force: true });

      // Check for alert
      cy.get(commonlocators.toastmsg).contains("false");

      deployMode.NavigateBacktoEditor();
    });

    it("3. shows updated formData values in onDateSelected binding", () => {
      const schema = {
        dob: "20/12/1992",
      };
      agHelper.AddDsl("jsonFormDslWithoutSchema");

      EditorNavigation.SelectEntityByName("JSONForm1", EntityType.Widget);
      propPane.EnterJSContext("Source data", JSON.stringify(schema), true);

      cy.openFieldConfiguration("dob");

      // Enable JS mode for onDateSelected
      cy.get(toggleJSButton("ondateselected")).click({ force: true });

      propPane.EnterJSContext("onDateSelected", "{{showAlert(formData.dob)}}");
      deployMode.DeployApp();

      // Click on select field
      cy.get(`${fieldPrefix}-dob .bp3-input`).click();
      cy.get(`${fieldPrefix}-dob .bp3-input`)
        .clear({ force: true })
        .type("10/08/2010");

      // Check for alert
      cy.contains("10/08/2010").should("be.visible");
    });
  },
);
