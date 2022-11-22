const dsl = require("../../../../fixtures/dynamicTabWidgetdsl.json");
const commonlocators = require("../../../../locators/commonlocators.json");

describe("Dynamic Height Width validation for Tab widget", function() {
  before(() => {
    cy.addDsl(dsl);
  });
  it("Tab widget validation of height with dynamic height feature", function() {
    //changing the Text Name and verifying
    cy.wait(3000);
    cy.openPropertyPane("tabswidget");
    cy.changeLayoutHeightWithoutWait(commonlocators.autoHeight);
    cy.get(".t--tabid-tab1").click({ force: true });
    cy.wait(3000);
    cy.get(".t--widget-tabswidget")
      .invoke("css", "height")
      .then((theight) => {
        cy.get(".t--tabid-tab2").click({ force: true });
        cy.wait(3000);
        cy.wait("@updateLayout").should(
          "have.nested.property",
          "response.body.responseMeta.status",
          200,
        );
        //cy.get(".t--draggable-checkboxwidget .bp3-control-indicator").click({ force: true })
        cy.get(".t--widget-tabswidget")
          .invoke("css", "height")
          .then((tnewheight) => {
            expect(theight).to.not.equal(tnewheight);
            cy.reload();
            cy.openPropertyPane("tabswidget");
            expect(theight).to.equal(theight);
          });
      });
    cy.changeLayoutHeight(commonlocators.fixed);
    cy.get(".t--tabid-tab1").click({ force: true });
    cy.wait(3000);
    cy.get(".t--widget-tabswidget")
      .invoke("css", "height")
      .then((theight) => {
        cy.get(".t--tabid-tab2").click({ force: true });
        cy.wait(3000);
        //cy.get(".t--draggable-checkboxwidget .bp3-control-indicator").click({ force: true })
        cy.get(".t--widget-tabswidget")
          .invoke("css", "height")
          .then((tnewheight) => {
            expect(theight).to.equal(tnewheight);
            cy.get(commonlocators.showTabsControl).click({ force: true });
            cy.wait("@updateLayout").should(
              "have.nested.property",
              "response.body.responseMeta.status",
              200,
            );
            cy.get(".t--widget-tabswidget")
              .invoke("css", "height")
              .then((upheight) => {
                expect(tnewheight).to.equal(upheight);
                cy.get(".t--tabid-tab1").should("not.exist");
                cy.get(".t--tabid-tab2").should("not.exist");
              });
          });
      });
  });
});
