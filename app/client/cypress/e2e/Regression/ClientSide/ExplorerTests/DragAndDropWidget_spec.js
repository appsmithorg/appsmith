import {
  PageLeftPane,
  PagePaneSegment,
} from "../../../../support/Pages/EditorNavigation";

const apiwidget = require("../../../../locators/apiWidgetslocator.json");
const explorer = require("../../../../locators/explorerlocators.json");
const commonlocators = require("../../../../locators/commonlocators.json");
const formWidgetsPage = require("../../../../locators/FormWidgets.json");
const widgetsPage = require("../../../../locators/Widgets.json");
import * as _ from "../../../../support/Objects/ObjectsCore";

describe("Entity explorer Drag and Drop widgets testcases", function () {
  it("1. Drag and drop form widget and validate", function () {
    cy.get(explorer.addWidget).click({ force: true });
    cy.get(commonlocators.entityExplorersearch).should("be.visible");
    cy.get(commonlocators.entityExplorersearch).clear().type("form");
    cy.dragAndDropToCanvas("formwidget", { x: 300, y: 80 });
    cy.get(formWidgetsPage.formD).click();
    /**
     * @param{Text} Random Text
     * @param{FormWidget}Mouseover
     * @param{FormPre Css} Assertion
     */
    cy.widgetText(
      "FormTest",
      formWidgetsPage.formWidget,
      widgetsPage.widgetNameSpan,
    );
    /**
     * @param{Text} Random Colour
     */
    cy.moveToStyleTab();
    cy.selectColor("backgroundcolor");
    cy.get(formWidgetsPage.formD)
      .should("have.css", "background-color")
      .and("eq", "rgb(219, 234, 254)");
    /**
     * @param{toggleButton Css} Assert to be checked
     */
    cy.moveToContentTab();
    cy.get(formWidgetsPage.formD)
      .scrollTo("bottom", { ensureScrollable: false })
      .should("be.visible");
    PageLeftPane.switchSegment(PagePaneSegment.Explorer);
    _.deployMode.DeployApp();
    _.deployMode.NavigateBacktoEditor();
    cy.CheckAndUnfoldEntityItem("Widgets");
    _.entityExplorer.ActionContextMenuByEntityName({
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
});
