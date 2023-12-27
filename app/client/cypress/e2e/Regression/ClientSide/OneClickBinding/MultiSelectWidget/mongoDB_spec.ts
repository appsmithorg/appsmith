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
import commonlocators from "../../../../../locators/commonlocators.json";
import EditorNavigation, {
  EntityType,
} from "../../../../../support/Pages/EditorNavigation";

const oneClickBinding = new OneClickBinding();

describe(
  "Table widget one click binding feature",
  { tags: ["@tag.Binding"] },
  () => {
    it("should check that queries are created and bound to table widget properly", () => {
      entityExplorer.DragDropWidgetNVerify(
        draggableWidgets.MULTISELECT,
        450,
        200,
      );

      dataSources.CreateDataSource("Mongo");

      cy.get("@dsName").then((dsName) => {
        EditorNavigation.SelectEntityByName("MultiSelect1", EntityType.Widget);

        oneClickBinding.ChooseAndAssertForm(`${dsName}`, dsName, "netflix", {
          label: "name",
          value: "director",
        });
      });

      agHelper.GetNClick(oneClickBindingLocator.connectData);

      assertHelper.AssertNetworkStatus("@postExecute");

      agHelper.Sleep(2000);

      entityExplorer.DragDropWidgetNVerify(draggableWidgets.TEXT, 450, 500);

      propPane.UpdatePropertyFieldValue(
        "Text",
        `{{MultiSelect1.selectedOptionLabels.toString()}}:{{MultiSelect1.selectedOptionValues.toString()}}`,
      );

      [
        {
          label: "I Care a Lot",
          text: "I Care a Lot:J Blakeson",
        },
        {
          label: "tick, tick...BOOM!",
          text: "I Care a Lot,tick, tick...BOOM!:J Blakeson,Lin-Manuel Miranda",
        },
        {
          label: "Munich – The Edge of War",
          text: "I Care a Lot,tick, tick...BOOM!,Munich – The Edge of War:J Blakeson,Lin-Manuel Miranda,Christian Schwochow",
        },
      ].forEach((d) => {
        cy.get(formWidgetsPage.multiSelectWidget)
          .find(".rc-select-selector")
          .click({
            force: true,
          });

        cy.get(".rc-select-item").contains(d.label).click({
          force: true,
        });
        cy.get(commonlocators.TextInside).first().should("have.text", d.text);
      });

      agHelper.Sleep(2000);

      cy.get(formWidgetsPage.multiselectWidgetv2search)
        .first()
        .focus({ force: true } as any)
        .type("Haunting", { force: true });

      assertHelper.AssertNetworkStatus("@postExecute");

      agHelper.Sleep(2000);

      cy.get(
        ".rc-select-item-option:contains('The Haunting of Hill House')",
      ).should("have.length", 1);
      cy.get(".rc-select-item")
        .contains("The Haunting of Hill House")
        .should("exist");
    });
  },
);
