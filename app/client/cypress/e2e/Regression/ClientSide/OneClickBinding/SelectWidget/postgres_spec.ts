import oneClickBindingLocator from "../../../../../locators/OneClickBindingLocator";
import { OneClickBinding } from "../spec_utility";
import {
  agHelper,
  entityExplorer,
  dataSources,
  draggableWidgets,
  assertHelper,
  propPane,
} from "../../../../../support/Objects/ObjectsCore";
import formWidgetsPage from "../../../../../locators/FormWidgets.json";
import widgetsPage from "../../../../../locators/Widgets.json";
import commonlocators from "../../../../../locators/commonlocators.json";
import EditorNavigation, {
  EntityType,
} from "../../../../../support/Pages/EditorNavigation";

const oneClickBinding = new OneClickBinding();

describe(
  "Table widget one click binding feature",
  { tags: ["@tag.Binding", "@tag.Sanity"] },
  () => {
    it("should check that queries are created and bound to table widget properly", () => {
      entityExplorer.DragDropWidgetNVerify(draggableWidgets.SELECT, 450, 200);

      dataSources.CreateDataSource("Postgres");

      cy.get("@dsName").then((dsName) => {
        EditorNavigation.SelectEntityByName("Select1", EntityType.Widget);
        propPane.ToggleJSMode("sourcedata", false);

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

      agHelper.GetNClick(oneClickBindingLocator.connectData);

      assertHelper.AssertNetworkStatus("@postExecute");

      agHelper.Sleep(2000);

      entityExplorer.DragDropWidgetNVerify(draggableWidgets.TEXT, 450, 500);

      propPane.UpdatePropertyFieldValue(
        "Text",
        `{{Select1.selectedOptionLabel}}:{{Select1.selectedOptionValue}}`,
      );

      [
        {
          label: "Andrew",
          text: "Andrew:Fuller",
        },
        {
          label: "Janet",
          text: "Janet:Leverling",
        },
        {
          label: "Margaret",
          text: "Margaret:Peacock",
        },
      ].forEach((d) => {
        cy.get(formWidgetsPage.selectWidget)
          .find(widgetsPage.dropdownSingleSelect)
          .click({
            force: true,
          });

        cy.get(commonlocators.singleSelectWidgetMenuItem)
          .contains(d.label)
          .click({
            force: true,
          });

        cy.get(commonlocators.TextInside).first().should("have.text", d.text);
      });

      cy.get(formWidgetsPage.selectWidget)
        .find(widgetsPage.dropdownSingleSelect)
        .click({
          force: true,
        });

      cy.get(commonlocators.selectInputSearch).type("Anne");

      assertHelper.AssertNetworkStatus("@postExecute");

      agHelper.Sleep(2000);

      cy.get(".select-popover-wrapper .menu-item-link")
        .children()
        .should("have.length", 1);

      agHelper.AssertElementExist(
        commonlocators.singleSelectWidgetMenuItem + `:contains(Anne)`,
      );
    });
  },
);
