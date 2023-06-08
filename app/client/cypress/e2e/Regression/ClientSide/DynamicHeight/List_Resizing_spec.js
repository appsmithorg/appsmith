const dsl = require("../../../../fixtures/ResizeListDsl.json");
const commonlocators = require("../../../../locators/commonlocators.json");
import * as _ from "../../../../support/Objects/ObjectsCore";

describe("Dynamic Height Width validation", function () {
  it("1. Validate change with auto height width for List widgets", function () {
    cy.addDsl(dsl);
    _.entityExplorer.SelectEntityByName("Tab 1","Tabs1");
    _.entityExplorer.SelectEntityByName("List1","Tab 1");
    cy.get(".t--widget-listwidgetv2")
      .invoke("css", "height")
      .then((lheight) => {
        cy.get(commonlocators.generalSectionHeight).should("not.exist");
        cy.moveToStyleTab();
        cy.testJsontext("itemspacing\\(px\\)", "16");
        cy.get(".t--widget-listwidgetv2")
          .invoke("css", "height")
          .then((newheight) => {
            expect(lheight).to.equal(newheight);
            cy.get(".rc-pagination:contains('5')").should("exist");
          });
      });
  });
});
