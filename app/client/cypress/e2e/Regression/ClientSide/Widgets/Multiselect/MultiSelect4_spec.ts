const widgetsPage = require("../../../../../locators/Widgets.json");
import OneClickBindingLocator from "../../../../../locators/OneClickBindingLocator";
import * as _ from "../../../../../support/Objects/ObjectsCore";
import EditorNavigation, {
  EntityType,
} from "../../../../../support/Pages/EditorNavigation";

const formWidgetsPage = require("../../../../../locators/FormWidgets.json");

const { OneClickBinding } = require("../../OneClickBinding/spec_utility");

const oneClickBinding = new OneClickBinding();

const defaultValue = `[
        {
          "label": "Green",
          "value": "GREEN"
        }
      ]`;

describe(
  "MultiSelect Widget Functionality",
  { tags: ["@tag.Widget", "@tag.Multiselect", "@tag.Binding"] },
  function () {
    before(() => {
      _.agHelper.AddDsl("emptyDSL");
    });
    beforeEach(() => {
      cy.wait(3000);
    });
    it("1. Add new multiselect widget", () => {
      _.entityExplorer.DragDropWidgetNVerify(_.draggableWidgets.MULTISELECT);
      _.propPane.ToggleJSMode("sourcedata");
      _.propPane.UpdatePropertyFieldValue(
        "Source Data",
        `[
        {
          "label": "Blue",
          "value": ""
        },
        {
          "label": "Green",
          "value": "GREEN"
        },
        {
          "label": "Red",
          "value": "RED"
        }
      ]`,
      );

      _.propPane.ToggleJSMode("labelkey");
      cy.updateCodeInput(
        ".t--property-control-wrapper.t--property-control-labelkey",
        `label`,
      );

      _.propPane.ToggleJSMode("valuekey");
      cy.updateCodeInput(".t--property-control-valuekey", `value`);

      _.propPane.UpdatePropertyFieldValue(
        "Default selected values",
        defaultValue,
      );
    });

    it("2. Copy and paste multiselect widget", () => {
      cy.openPropertyPane("multiselectwidgetv2");
      const modifierKey = Cypress.platform === "darwin" ? "meta" : "ctrl";
      //copy and paste
      cy.openPropertyPane("multiselectwidgetv2");
      cy.get("body").type(`{${modifierKey}}c`);
      // eslint-disable-next-line cypress/no-unnecessary-waiting
      cy.wait(500);
      cy.get("body").click();
      cy.get("body").type(`{${modifierKey}}v`, { force: true });
      cy.wait("@updateLayout").should(
        "have.nested.property",
        "response.body.responseMeta.status",
        200,
      );
      cy.get(widgetsPage.multiSelectWidget).should("have.length", 2);

      cy.get(".t--property-control-defaultselectedvalues")
        .first()
        .click({ force: true })
        .find(".CodeMirror")
        .first()
        .then((ins) => {
          const input = ins[0].CodeMirror;
          let val = input.getValue();
          try {
            val = JSON.parse(val);
            expect(val).to.deep.equal(JSON.parse(defaultValue));
          } catch (error) {}
        });
    });

    it("3. Select tooltip renders if tooltip prop is not empty", () => {
      cy.openPropertyPane("multiselectwidgetv2");
      // enter tooltip in property pan
      cy.get(widgetsPage.inputTooltipControl).type(
        "Helpful text for tooltip !",
      );
      // tooltip help icon shows
      cy.get(".multiselect-tooltip").should("be.visible");
    });

    it("4. multi Select widget selection is not cleared when the widget is server side filtered", () => {
      // Turn off server side filtering for the widget
      _.agHelper.CheckUncheck(widgetsPage.serversideFilteringInput, false);

      _.propPane.UpdatePropertyFieldValue("Source Data", "");

      _.propPane.ToggleJSMode("sourcedata", false);

      _.dataSources.CreateDataSource("Postgres");

      cy.get("@dsName").then((dsName) => {
        EditorNavigation.SelectEntityByName("MultiSelect1", EntityType.Widget);

        oneClickBinding.ChooseAndAssertForm(
          `${dsName}`,
          dsName,
          "public.employees",
          {
            label: "first_name",
            value: "last_name",
          },
        );
      });

      _.agHelper.GetNClick(OneClickBindingLocator.connectData);

      _.assertHelper.AssertNetworkStatus("@postExecute");

      cy.get(formWidgetsPage.multiselectwidgetv2)
        .find(".rc-select-selection-search-input")
        .first()
        .focus({ force: true })
        .type("{uparrow}", { force: true });

      cy.get(".rc-select-dropdown input[type='text']")
        .click()
        .clear()
        .type("Janet");

      cy.get(".multi-select-dropdown").contains("Janet").click({ force: true });

      cy.get(formWidgetsPage.multiselectwidgetv2)
        .find(".rc-select-selection-search-input")
        .first()
        .focus({ force: true })
        .type("{uparrow}", { force: true });

      cy.get(".rc-select-dropdown input[type='text']")
        .click()
        .clear()
        .type("Steven");

      _.assertHelper.AssertNetworkStatus("@postExecute");

      cy.get(".rc-select-selection-item-content").should("contain", "Janet");
    });
  },
);
