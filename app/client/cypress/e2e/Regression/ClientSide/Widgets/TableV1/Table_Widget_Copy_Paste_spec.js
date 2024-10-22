import {
  PageLeftPane,
  PagePaneSegment,
} from "../../../../../support/Pages/EditorNavigation";

const apiwidget = require("../../../../../locators/apiWidgetslocator.json");
const commonlocators = require("../../../../../locators/commonlocators.json");
const widgetsPage = require("../../../../../locators/Widgets.json");
import {
  agHelper,
  entityExplorer,
} from "../../../../../support/Objects/ObjectsCore";

describe(
  "Test Suite to validate copy/paste table Widget",
  { tags: ["@tag.Widget", "@tag.Table", "@tag.Binding"] },
  function () {
    before(() => {
      agHelper.AddDsl("tableNewDsl");
    });

    it("Copy paste table widget and valdiate application status", function () {
      const modifierKey = Cypress.platform === "darwin" ? "meta" : "ctrl";
      cy.openPropertyPane("tablewidget");
      cy.widgetText(
        "Table1",
        widgetsPage.tableWidget,
        widgetsPage.widgetNameSpan,
      );
      cy.get("body").type(`{${modifierKey}}c`);
      // eslint-disable-next-line cypress/no-unnecessary-waiting
      cy.wait(500);
      cy.get(commonlocators.toastBody).first().contains("Copied");
      cy.get("body").click();
      cy.get("body").type(`{${modifierKey}}v`, { force: true });
      cy.wait("@updateLayout").should(
        "have.nested.property",
        "response.body.responseMeta.status",
        200,
      );
      cy.get(commonlocators.toastAction).should("be.visible");

      //Check after copying new table widget should not have any warnings
      cy.get('.t--widget-propertypane-toggle [name="warning"]').should(
        "not.exist",
      );
      cy.get(commonlocators.toastAction).should("not.be.visible");
      cy.wait(2000);
      PageLeftPane.switchSegment(PagePaneSegment.UI);
      entityExplorer.ActionContextMenuByEntityName({
        entityNameinLeftSidebar: "Table1Copy",
        action: "Show bindings",
      });
      cy.wait(200);
      cy.get(apiwidget.propertyList).then(function ($lis) {
        expect($lis).to.have.length(13);
        expect($lis.eq(0)).to.contain("{{Table1Copy.selectedRow}}");
        expect($lis.eq(1)).to.contain("{{Table1Copy.selectedRows}}");
      });
    });
  },
);
