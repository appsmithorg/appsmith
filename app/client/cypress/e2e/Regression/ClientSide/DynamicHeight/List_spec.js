const dsl = require("../../../../fixtures/dynamicHeightListDsl.json");
const commonlocators = require("../../../../locators/commonlocators.json");
import * as _ from "../../../../support/Objects/ObjectsCore";

describe("Dynamic Height Width validation", function () {
  it("1. Validate change with auto height width for widgets", function () {
    const textMsg = "Dynamic panel validation for text widget wrt height";
    cy.addDsl(dsl);
    _.entityExplorer.SelectEntityByName("List1");
    cy.get(".t--widget-listwidget")
      .invoke("css", "height")
      .then((lheight) => {
        cy.get(commonlocators.generalSectionHeight).should("not.exist");
        _.entityExplorer.SelectEntityByName("Container1","List1");
        _.entityExplorer.SelectEntityByName("Text1","Container1");
        cy.get(commonlocators.generalSectionHeight).should("not.exist");
        cy.testCodeMirror(textMsg);
        _.entityExplorer.SelectEntityByName("Text2","Container1");
        cy.get(commonlocators.generalSectionHeight).should("not.exist");
        cy.testCodeMirror(textMsg);
        cy.get(".t--widget-listwidget")
          .invoke("css", "height")
          .then((newheight) => {
            expect(lheight).to.equal(newheight);
          });
      });
  });
});
