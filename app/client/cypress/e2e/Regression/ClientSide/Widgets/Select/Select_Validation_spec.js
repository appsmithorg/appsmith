/* eslint-disable cypress/no-unnecessary-waiting */
import EditorNavigation, {
  EntityType,
} from "../../../../../support/Pages/EditorNavigation";

const commonlocators = require("../../../../../locators/commonlocators.json");
import * as _ from "../../../../../support/Objects/ObjectsCore";

describe(
  "Select Widget Functionality",
  { tags: ["@tag.Widget", "@tag.Select", "@tag.Sanity", "@tag.Binding"] },
  function () {
    before(() => {
      _.entityExplorer.DragDropWidgetNVerify(_.draggableWidgets.SELECT);
    });

    it("1. Select Widget name update/Disabeld state", function () {
      _.propPane.RenameWidget("Select1", "SelectRenamed");
      // Disable the widget and check visibility in publish mode
      _.propPane.TogglePropertyState("Disabled", "On");
      cy.get(".bp3-disabled").should("be.visible");
      _.deployMode.DeployApp();
      cy.get(".bp3-disabled").should("be.visible");
      _.deployMode.NavigateBacktoEditor();
      //Enable the widget and check in publish mode", function () {
      cy.openPropertyPane("selectwidget");
      EditorNavigation.SelectEntityByName("SelectRenamed", EntityType.Widget);
      cy.get(".bp3-disabled").should("be.visible");
      _.propPane.TogglePropertyState("Disabled", "Off");
      cy.get(".t--widget-selectwidget .bp3-button").should("be.visible");
      _.deployMode.DeployApp();
      cy.get(".t--widget-selectwidget .bp3-button")
        .should("be.visible")
        .click({ force: true });
      cy.get(commonlocators.singleSelectActiveMenuItem).should(
        "contain.text",
        "Green",
      );
      _.deployMode.NavigateBacktoEditor();
    });
  },
);
