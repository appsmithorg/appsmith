import EditorNavigation, {
  EntityType,
  AppSidebarButton,
  AppSidebar,
} from "../../../../../support/Pages/EditorNavigation";

const commonlocators = require("../../../../../locators/commonlocators.json");
import * as _ from "../../../../../support/Objects/ObjectsCore";

describe(
  "Dropdown Widget Check value does not reset on navigation",
  { tags: ["@tag.Widget", "@tag.Dropdown", "@tag.Binding"] },
  function () {
    before(() => {
      _.agHelper.AddDsl("dropDownWidget_reset_check_dsl");
    });

    it("1. Check if the dropdown value does not change on navigation", function () {
      //Change the value of drop down;
      cy.wait(4000); //settling time for dsl into layout

      cy.get(commonlocators.selectButton).last().click();
      cy.selectWidgetOnClickOption("Red");
      cy.wait(200);

      //Navigate
      AppSidebar.navigate(AppSidebarButton.Data);
      AppSidebar.navigate(AppSidebarButton.Editor);

      //Again navigate back to the widget
      EditorNavigation.SelectEntityByName("Select3", EntityType.Widget);

      //Check for the select value again
      cy.get(
        `.t--draggable-selectwidget .bp3-popover-target ${commonlocators.menuSelection}`,
      )
        .last()
        .should("have.text", "Red");
    });
  },
);
