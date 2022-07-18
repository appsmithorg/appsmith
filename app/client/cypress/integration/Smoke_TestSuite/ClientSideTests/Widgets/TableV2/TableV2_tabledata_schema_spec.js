const explorer = require("../../../../../locators/explorerlocators.json");
import homePage from "../../../../../locators/HomePage";
const publish = require("../../../../../locators/publishWidgetspage.json");

describe("Table Widget", function() {
  it("1. Table Widget Functionality To Check with changing schema of tabledata", () => {
    let jsContext = `{{Switch1.isSwitchedOn?[{name: "joe"}]:[{employee_name: "john"}];}}`;
    cy.NavigateToHome();
    cy.get(homePage.createNew)
      .first()
      .click({ force: true });
    cy.wait("@createNewApplication").should(
      "have.nested.property",
      "response.body.responseMeta.status",
      201,
    );
    cy.get(explorer.addWidget).click();
    cy.dragAndDropToCanvas("switchwidget", { x: 200, y: 200 });
    cy.dragAndDropToCanvas("tablewidgetv2", { x: 200, y: 300 });
    cy.wait(1000);
    cy.wait("@updateLayout");
    cy.get(".t--property-control-tabledata").then(($el) => {
      cy.updateCodeInput($el, jsContext);
    });
    cy.PublishtheApp();
    cy.wait(30000);
    cy.getTableV2DataSelector("0", "0").then((element) => {
      cy.get(element).should("be.visible");
    });
    cy.readTableV2dataPublish("0", "0").then((value) => {
      expect(value).to.be.equal("joe");
    });
    cy.get(".t--switch-widget-active")
      .first()
      .click();
    cy.wait(1000);
    cy.getTableV2DataSelector("0", "0").then((element) => {
      cy.get(element).should("be.visible");
    });
    cy.readTableV2dataPublish("0", "0").then((value) => {
      expect(value).to.be.equal("john");
    });
    cy.get(".t--switch-widget-inactive")
      .first()
      .click();
    cy.wait(1000);
    cy.getTableV2DataSelector("0", "0").then((element) => {
      cy.get(element).should("be.visible");
    });
    cy.readTableV2dataPublish("0", "0").then((value) => {
      expect(value).to.be.equal("joe");
    });

    cy.get(publish.backToEditor)
      .click()
      .wait(1000);
    cy.wait(30000);
    cy.CheckAndUnfoldEntityItem("WIDGETS");
    cy.actionContextMenuByEntityName("Switch1");
    cy.actionContextMenuByEntityName("Table1");
  });
});
