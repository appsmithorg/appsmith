const dsl = require("../../../../fixtures/autoLayoutContainerWidgetDsl.json");
import { ObjectsRegistry } from "../../../../support/Objects/Registry";
const agHelper = ObjectsRegistry.AggregateHelper;

describe("Validating Mobile Views", function () {
  afterEach(() => {
    agHelper.SaveLocalStorageCache();
  });

  beforeEach(() => {
    agHelper.RestoreLocalStorageCache();
  });
  it("Validate change with height width for widgets", function () {
    cy.addDsl(dsl);
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
            cy.PublishtheApp();
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
