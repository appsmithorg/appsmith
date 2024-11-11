import {
  PageLeftPane,
  PagePaneSegment,
} from "../../../../../support/Pages/EditorNavigation";

import * as _ from "../../../../../support/Objects/ObjectsCore";

describe(
  "Table Widget",
  { tags: ["@tag.Widget", "@tag.Table", "@tag.Binding"] },
  function () {
    before(() => {
      _.agHelper.AddDsl("tableNewDsl");
    });
    it("1. Table Widget Functionality To Check with changing schema of tabledata", () => {
      let jsContext = `{{Switch1.isSwitchedOn?[{name: "joe"}]:[{employee_name: "john"}];}}`;
      cy.wait(5000);
      cy.dragAndDropToCanvas("switchwidget", { x: 200, y: 200 });
      cy.wait(2000);
      cy.openPropertyPane("tablewidget");
      cy.get(".t--property-control-tabledata").then(($el) => {
        cy.updateCodeInput($el, jsContext);
      });
      _.deployMode.DeployApp();
      cy.getTableDataSelector("0", "0").then((element) => {
        cy.get(element).should("be.visible");
      });
      cy.readTabledataPublish("0", "0").then((value) => {
        expect(value).to.be.equal("joe");
      });
      cy.get(".t--switch-widget-active").first().click();
      cy.get(".t--widget-tablewidget").scrollIntoView();
      cy.wait(1000);
      cy.getTableDataSelector("0", "0").then((element) => {
        cy.get(element).should("be.visible");
      });
      cy.readTabledataPublish("0", "0").then((value) => {
        expect(value).to.be.equal("john");
      });
      cy.get(".t--switch-widget-inactive").first().click();
      cy.wait(1000);
      cy.get(".t--widget-tablewidget").scrollIntoView();
      cy.getTableDataSelector("0", "0").then((element) => {
        cy.get(element).should("be.visible");
      });
      cy.readTabledataPublish("0", "0").then((value) => {
        expect(value).to.be.equal("joe");
      });
      _.deployMode.NavigateBacktoEditor();
      PageLeftPane.switchSegment(PagePaneSegment.UI);
      _.entityExplorer.DeleteWidgetFromEntityExplorer("Switch1");
      _.entityExplorer.DeleteWidgetFromEntityExplorer("Table1");
    });
  },
);
