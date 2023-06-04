import * as _ from "../../../../support/Objects/ObjectsCore";

describe("Validating Mobile Views", function () {
  it("1. Validate change with height width for widgets", function () {
    cy.fixture("autoLayoutContainerWidgetDsl").then((val) => {
      _.agHelper.AddDsl(val);
    });
    cy.wait(5000); //for dsl to settle
    //cy.openPropertyPane("containerwidget");
    cy.get(".t--entity-name:contains('Container1')").click({ force: true });
    cy.get(".t--widget-containerwidget")
      .first()
      .invoke("css", "height")
      .then((height) => {
        cy.get(".t--entity-name:contains('Container2')").click({ force: true });
        cy.get(".t--widget-containerwidget")
          .invoke("css", "height")
          .then((newheight) => {
            _.deployMode.DeployApp();
            cy.get(".t--widget-containerwidget")
              .first()
              .invoke("css", "height")
              .then((height) => {
                cy.get(".t--widget-containerwidget")
                  .last()
                  .invoke("css", "height")
                  .then((newheight) => {
                    expect(parseFloat(newheight)).to.be.lessThan(
                      parseFloat(height),
                    );
                  });
              });
            cy.get(".t--widget-containerwidget")
              .first()
              .invoke("css", "width")
              .then((width) => {
                cy.get(".t--widget-containerwidget")
                  .last()
                  .invoke("css", "width")
                  .then((newwidth) => {
                    expect(width).to.equal(newwidth);
                  });
              });
          });
      });
  });
});
