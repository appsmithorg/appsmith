/**
 * Spec to test the filterText update action trigger in Select and MultiSelect widget
 */

const dslWithoutSchema = require("../../../../../fixtures/jsonFormDslWithoutSchema.json");
const commonlocators = require("../../../../../locators/commonlocators.json");
const onFilterUpdateJSBtn = ".t--property-control-onfilterupdate .t--js-toggle";
const fieldPrefix = ".t--jsonformfield";
import {
  deployMode,
  entityExplorer,
  propPane,
} from "../../../../../support/Objects/ObjectsCore";
import { ObjectsRegistry } from "../../../../../support/Objects/Registry";
let agHelper = ObjectsRegistry.AggregateHelper;
let locators = ObjectsRegistry.CommonLocators;

describe(
  "JSONForm Select field - filterText update action trigger ",
  { tags: ["@tag.All", "@tag.JSONForm", "@tag.Binding"] },
  () => {
    beforeEach(() => {
      agHelper.RestoreLocalStorageCache();
    });

    afterEach(() => {
      agHelper.SaveLocalStorageCache();
    });

    before(
      "JSONForm Select field - filterText update action trigger - pre condition",
      () => {
        const schema = {
          color: "GREEN",
        };
        cy.addDsl(dslWithoutSchema);
        cy.openPropertyPane("jsonformwidget");
        propPane.EnterJSContext("Source data", JSON.stringify(schema), true);
        cy.openFieldConfiguration("color");
        cy.selectDropdownValue(commonlocators.jsonFormFieldType, /^Select$/);
        cy.closePropertyPane();
      },
    );

    it("1. shows alert on filter text change", () => {
      const filterText = "Test string";

      cy.openPropertyPane("jsonformwidget");
      cy.openFieldConfiguration("color");

      // Enable filterable
      propPane.TogglePropertyState("Allow searching", "On");
      propPane.TogglePropertyState("Server side filtering", "On");

      propPane.EnterJSContext(
        "onFilterUpdate",
        "{{showAlert('Filter update:' + fieldState?.color?.filterText)}}",
      );

      deployMode.DeployApp();
      // click select field and filter input should exist
      cy.get(`${fieldPrefix}-color .bp3-control-group`).click({ force: true });
      cy.get(`.bp3-select-popover .bp3-input-group`).should("exist");

      // Type "Test string" in the filterable input.
      cy.get(`.bp3-select-popover .bp3-input-group input`).type(filterText);

      cy.get(commonlocators.toastmsg).contains(`Filter update:${filterText}`);
      deployMode.NavigateBacktoEditor();
    });

    it("2. shows alert on filter text change", () => {
      // JSONForm Multiselect field - filterText update action trigger - pre condition
      const schema = {
        colors: ["GREEN", "BLUE"],
      };
      cy.addDsl(dslWithoutSchema);
      cy.openPropertyPane("jsonformwidget");
      propPane.EnterJSContext("Source data", JSON.stringify(schema), true);

      const filterText = "Test string";

      cy.openPropertyPane("jsonformwidget");
      cy.openFieldConfiguration("colors");

      propPane.TogglePropertyState("Allow searching", "On");
      propPane.TogglePropertyState("Server side filtering", "On");

      // Enable JS mode for onFilterUpdate
      cy.get(onFilterUpdateJSBtn).click({ force: true });

      // Add onFilterUpdate action
      cy.testJsontext(
        "onfilterupdate",
        "{{showAlert('Filter update:' + fieldState?.colors?.filterText)}}",
      );

      deployMode.DeployApp();
      // Open multiselect field and filter input should exist
      cy.get(`${fieldPrefix}-colors`)
        .find(".rc-select-selection-search-input")
        .first()
        .focus({ force: true })
        .type("{uparrow}", { force: true });
      cy.get(".multi-select-dropdown input.bp3-input").should("exist");

      // Type "Test string" in the filterable input.
      cy.get(".multi-select-dropdown input.bp3-input").type(filterText);

      cy.get(commonlocators.toastmsg).contains(`Filter update:${filterText}`);
    });
  },
);
