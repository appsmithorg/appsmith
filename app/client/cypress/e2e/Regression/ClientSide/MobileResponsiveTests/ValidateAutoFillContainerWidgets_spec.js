const dsl = require("../../../../fixtures/AutolayoutWidgetsDsl.json");

describe("Validating Mobile Views", function () {
  it("1. Validate change with height width for widgets", function () {
    cy.addDsl(dsl);
    cy.wait(5000); //for dsl to settle
    //cy.openPropertyPane("containerwidget");
    cy.get(".t--entity-name:contains('Container1')").click({ force: true });
    cy.get(".t--widget-containerwidget")
      .first()
      .invoke("css", "height")
      .then(() => {
        cy.get(".t--entity-name:contains('Container2')").click({ force: true });
        cy.get(".t--widget-containerwidget")
          .invoke("css", "height")
          .then(() => {
            cy.PublishtheApp();
            cy.get(".t--widget-containerwidget")
              .first()
              .invoke("css", "height")
              .then((height) => {
                cy.get(".t--widget-containerwidget")
                  .last()
                  .invoke("css", "height")
                  .then((newheight) => {
                    expect(height).to.equal(newheight);
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
