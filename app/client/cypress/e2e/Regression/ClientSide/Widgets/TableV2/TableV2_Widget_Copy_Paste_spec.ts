import {
  PageLeftPane,
  PagePaneSegment,
} from "../../../../../support/Pages/EditorNavigation";

const apiwidget = require("../../../../../locators/apiWidgetslocator.json");
const commonlocators = require("../../../../../locators/commonlocators.json");
const widgetsPage = require("../../../../../locators/Widgets.json");
import { featureFlagIntercept } from "../../../../../support/Objects/FeatureFlags";
import {
  agHelper,
  entityExplorer,
} from "../../../../../support/Objects/ObjectsCore";

describe(
  "Test Suite to validate copy/paste table Widget V2",
  { tags: ["@tag.Widget", "@tag.Table", "@tag.Binding"] },
  function () {
    before(() => {
      agHelper.AddDsl("tableV2NewDsl");
    });
    it("1. Copy paste table widget and valdiate application status", function () {
      const modifierKey = Cypress.platform === "darwin" ? "meta" : "ctrl";
      cy.openPropertyPane("tablewidgetv2");
      cy.widgetText(
        "Table1",
        widgetsPage.tableWidgetV2,
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
      PageLeftPane.switchSegment(PagePaneSegment.UI);
      entityExplorer.ActionContextMenuByEntityName({
        entityNameinLeftSidebar: "Table1Copy",
        action: "Show bindings",
      });
      cy.wait(200);
      cy.get(apiwidget.propertyList).then(function ($lis) {
        expect($lis).to.have.length(22);
        expect($lis.eq(0)).to.contain("{{Table1Copy.selectedRow}}");
        expect($lis.eq(1)).to.contain("{{Table1Copy.selectedRows}}");
      });
    });

    it("2. Should check that table binding list gets updated when .filters gets added to it", () => {
      featureFlagIntercept({
        release_table_serverside_filtering_enabled: true,
      });
      PageLeftPane.switchSegment(PagePaneSegment.UI);
      entityExplorer.ActionContextMenuByEntityName({
        entityNameinLeftSidebar: "Table1Copy",
        action: "Show bindings",
      });
      cy.wait(200);
      cy.get(apiwidget.propertyList).then(function ($lis) {
        expect($lis).to.have.length(23);
        expect($lis.last()).to.contain("{{Table1Copy.filters}}");
      });
    });
  },
);
