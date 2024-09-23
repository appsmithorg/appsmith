import EditorNavigation, {
  EntityType,
} from "../../../../support/Pages/EditorNavigation";

const apiwidget = require("../../../../locators/apiWidgetslocator.json");
const commonlocators = require("../../../../locators/commonlocators.json");
import {
  agHelper,
  entityExplorer,
  propPane,
} from "../../../../support/Objects/ObjectsCore";
import { EntityItems } from "../../../../support/Pages/AssertHelper";

before(() => {
  agHelper.AddDsl("formWidgetdsl");
});

describe(
  "Test Suite to validate copy/delete/undo functionalites",
  { tags: ["@tag.IDE", "@tag.Sanity"] },
  function () {
    const modifierKey = Cypress.platform === "darwin" ? "meta" : "ctrl";

    it("1. Drag and drop form widget and validate copy widget via toast message", function () {
      EditorNavigation.SelectEntityByName("Form1", EntityType.Widget);
      propPane.RenameWidget("Form1", "FormTest");
      cy.get(commonlocators.copyWidget).click();
      // eslint-disable-next-line cypress/no-unnecessary-waiting
      cy.wait(500);
      cy.get(commonlocators.toastBody).first().contains("Copied");
    });

    it("2. Delete Widget from sidebar and Undo action validation", function () {
      entityExplorer.ActionContextMenuByEntityName({
        entityNameinLeftSidebar: "FormTest",
        action: "Show bindings",
      });
      cy.get(apiwidget.propertyList).then(function ($lis) {
        expect($lis).to.have.length(3);
        expect($lis.eq(0)).to.contain("{{FormTest.isVisible}}");
        expect($lis.eq(1)).to.contain("{{FormTest.data}}");
        expect($lis.eq(2)).to.contain("{{FormTest.hasChanges}}");
      });
      entityExplorer.ActionContextMenuByEntityName({
        entityNameinLeftSidebar: "FormTest",
        action: "Delete",
        entityType: EntityItems.Widget,
      });

      cy.get("body").type(`{${modifierKey}}z`, { force: true });
      cy.wait("@updateLayout").should(
        "have.nested.property",
        "response.body.responseMeta.status",
        200,
      );
      // eslint-disable-next-line cypress/no-unnecessary-waiting
      cy.wait(500);
      entityExplorer.ActionContextMenuByEntityName({
        entityNameinLeftSidebar: "FormTest",
        action: "Show bindings",
      });
      cy.get(apiwidget.propertyList).then(function ($lis) {
        expect($lis).to.have.length(3);
        expect($lis.eq(0)).to.contain("{{FormTest.isVisible}}");
        expect($lis.eq(1)).to.contain("{{FormTest.data}}");
        expect($lis.eq(2)).to.contain("{{FormTest.hasChanges}}");
      });
    });
  },
);
