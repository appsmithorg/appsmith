const commonlocators = require("../../../../../locators/commonlocators.json");
const formWidgetsPage = require("../../../../../locators/FormWidgets.json");
import * as _ from "../../../../../support/Objects/ObjectsCore";

describe(
  "Switch Group Widget Functionality",
  { tags: ["@tag.Widget", "@tag.Switch", "@tag.Binding"] },
  function () {
    before(() => {
      _.agHelper.AddDsl("SwitchGroupWidgetDsl");
      _.propPane.RenameWidget("SwitchGroup1", "SwitchGroupTest");
    });

    it("1. Check isDirty meta property", function () {
      cy.openPropertyPane("textwidget");
      cy.updateCodeInput(
        ".t--property-control-text",
        `{{SwitchGroupTest.isDirty}}`,
      );
      // Change defaultSelectedValues
      cy.openPropertyPane("switchgroupwidget");
      cy.updateCodeInput(
        ".t--property-control-defaultselectedvalues",
        `[\n"BLUE"\n]`,
      );
      // Check if isDirty is reset to false
      cy.get(".t--widget-textwidget").should("contain", "false");
      cy.wait(200); // Switch group takes time to reflect default value changes
      // Interact with UI
      cy.get(formWidgetsPage.labelSwitchGroup).first().click();
      // Check if isDirty is set to true
      cy.get(".t--widget-textwidget").should("contain", "true");
      // Change defaultSelectedValues
      cy.openPropertyPane("switchgroupwidget");
      cy.updateCodeInput(
        ".t--property-control-defaultselectedvalues",
        `[\n"GREEN"\n]`,
      );
      // Check if isDirty is reset to false
      cy.get(".t--widget-textwidget").should("contain", "false");
    });
  },
);
