const dsl = require("../../../../fixtures/dynamicTabWidgetdsl.json");
const commonlocators = require("../../../../locators/commonlocators.json");
const publish = require("../../../../locators/publishWidgetspage.json");

describe("Dynamic Height Width validation for Tab widget", function() {
  before(() => {
    cy.addDsl(dsl);
  });

  function validateHeight() {
    cy.wait(5000);
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
          });
      });
  }
  it("Tab widget validation of height with dynamic height feature with publish mode", function() {
    //changing the Text Name and verifying
    cy.wait(3000);
    cy.openPropertyPane("tabswidget");
    cy.changeLayoutHeightWithoutWait(commonlocators.autoHeight);
    cy.get(".t--tabid-tab1").click({ force: true });
    validateHeight();
    cy.PublishtheApp();
    validateHeight();
    cy.get(publish.backToEditor).click();
    cy.get(".t--switch-preview-mode-toggle").should("be.visible");
    cy.get(".t--switch-preview-mode-toggle").click({ force: true });
    cy.wait(5000);
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
            expect(theight).to.not.equal(tnewheight);
          });
      });
  });

  it("Tab widget validation of height with preview mode", function() {
    cy.get(".t--switch-comment-mode-off").should("be.visible");
    cy.get(".t--switch-comment-mode-off").click({ force: true });
    cy.wait(3000);
    cy.openPropertyPane("tabswidget");
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

  it("Tab widget validation of height with reload", function() {
    cy.wait(3000);
    cy.openPropertyPane("tabswidget");
    cy.get(commonlocators.generalSectionHeight).should("be.visible");
    cy.get(commonlocators.showTabsControl).click({ force: true });
    cy.changeLayoutHeight(commonlocators.autoHeight);
    cy.wait(3000);
    cy.get(".t--tabid-tab1").click({ force: true });
    cy.wait(5000);
    cy.get(".t--widget-tabswidget")
      .invoke("css", "height")
      .then((theight) => {
        cy.get(".t--tabid-tab2").click({ force: true });
        cy.changeLayoutHeight(commonlocators.fixed);
        cy.wait(3000);
        cy.reload();
        cy.openPropertyPane("tabswidget");
        cy.get(".t--widget-tabswidget")
          .invoke("css", "height")
          .then((tnewheight) => {
            expect(theight).to.not.equal(tnewheight);
          });
      });
  });
});
