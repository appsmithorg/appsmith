import {
  PageLeftPane,
  PagePaneSegment,
} from "../../../../../support/Pages/EditorNavigation";

import homePage from "../../../../../locators/HomePage";
import * as _ from "../../../../../support/Objects/ObjectsCore";

describe("Table Widget", { tags: ["@tag.Widget", "@tag.Table", "@tag.Binding"] }, function () {
  it("1. Table Widget Functionality To Check with changing schema of tabledata", () => {
    let jsContext = `{{Switch1.isSwitchedOn?[{name: "joe"}]:[{employee_name: "john"}];}}`;
    _.homePage.NavigateToHome();
    _.homePage.CreateNewApplication();
    cy.wait("@createNewApplication").should(
      "have.nested.property",
      "response.body.responseMeta.status",
      201,
    );
    cy.dragAndDropToCanvas("switchwidget", { x: 200, y: 200 });
    cy.dragAndDropToCanvas("tablewidgetv2", { x: 200, y: 300 });
    _.propPane.EnterJSContext("Table data", jsContext);
    _.deployMode.DeployApp();
    cy.wait(5000);
    cy.getTableV2DataSelector("0", "0").then((element) => {
      cy.get(element).should("be.visible");
    });
    cy.wait(2000);
    cy.readTableV2dataPublish("0", "0").then((value) => {
      expect(value).to.be.equal("joe");
    });
    cy.get(".t--switch-widget-active").first().click();
    cy.wait(3000);
    cy.getTableV2DataSelector("0", "0").then((element) => {
      cy.get(element).should("be.visible");
    });
    cy.readTableV2dataPublish("0", "0").then((value) => {
      expect(value).to.be.equal("john");
    });
    cy.get(".t--switch-widget-inactive").first().click();
    cy.wait(1000);
    cy.getTableV2DataSelector("0", "0").then((element) => {
      cy.get(element).should("be.visible");
    });
    cy.readTableV2dataPublish("0", "0").then((value) => {
      expect(value).to.be.equal("joe");
    });

    _.deployMode.NavigateBacktoEditor();
    cy.wait(5000);
    PageLeftPane.switchSegment(PagePaneSegment.UI);

    _.entityExplorer.DeleteWidgetFromEntityExplorer("Switch1");
    _.entityExplorer.DeleteWidgetFromEntityExplorer("Table1");
  });
});
