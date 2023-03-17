const dsl = require("../../../../fixtures/multipleContainerdsl.json");
const commonlocators = require("../../../../locators/commonlocators.json");

describe("Dynamic Height Width validation for multiple container", function() {
  before(() => {
    cy.addDsl(dsl);
  });
  it("Validate change in auto height width with multiple containers", function() {
    cy.wait(3000); //for dsl to settle
    cy.openPropertyPaneWithIndex("containerwidget", 0);
    cy.changeLayoutHeight(commonlocators.fixed);
    cy.changeLayoutHeight(commonlocators.autoHeight);
    cy.openPropertyPaneWithIndex("containerwidget", 1);
    cy.changeLayoutHeight(commonlocators.fixed);
    cy.changeLayoutHeight(commonlocators.autoHeight);
    cy.openPropertyPane("checkboxgroupwidget");
    cy.changeLayoutHeight(commonlocators.fixed);
    cy.changeLayoutHeight(commonlocators.autoHeight);
    cy.wait(2000);
    cy.get(".t--widget-containerwidget")
      .eq(0)
      .invoke("css", "height")
      .then((oheight) => {
        cy.get(".t--widget-containerwidget")
          .eq(1)
          .invoke("css", "height")
          .then((mheight) => {
            cy.get(".t--widget-containerwidget")
              .eq(2)
              .invoke("css", "height")
              .then((iheight) => {
                cy.get(".t--widget-checkboxgroupwidget")
                  .invoke("css", "height")
                  .then((checkboxheight) => {
                    cy.get(commonlocators.addOption).click({ force: true });
                    cy.wait("@updateLayout").should(
                      "have.nested.property",
                      "response.body.responseMeta.status",
                      200,
                    );
                    cy.wait(3000);
                    cy.get(".t--widget-checkboxgroupwidget")
                      .invoke("css", "height")
                      .then((newcheckboxheight) => {
                        expect(checkboxheight).to.not.equal(newcheckboxheight);
                      });
                  });
                cy.wait(2000);
                cy.get(".t--widget-containerwidget")
                  .eq(0)
                  .invoke("css", "height")
                  .then((onewheight) => {
                    expect(oheight).to.not.equal(onewheight);
                  });
                cy.get(".t--widget-containerwidget")
                  .eq(1)
                  .invoke("css", "height")
                  .then((mnewheight) => {
                    expect(mheight).to.not.equal(mnewheight);
                  });
                cy.get(".t--widget-containerwidget")
                  .eq(2)
                  .invoke("css", "height")
                  .then((inewheight) => {
                    expect(iheight).to.not.equal(inewheight);
                  });
              });
          });
      });
  });
});
