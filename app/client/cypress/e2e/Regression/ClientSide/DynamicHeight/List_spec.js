const commonlocators = require("../../../../locators/commonlocators.json");
import {
  entityExplorer,
  agHelper,
} from "../../../../support/Objects/ObjectsCore";

describe("Dynamic Height Width validation", function () {
  it("1. Validate change with auto height width for widgets", function () {
    const textMsg = "Dynamic panel validation for text widget wrt height";
    cy.fixture("dynamicHeightListDsl").then((val) => {
      agHelper.AddDsl(val);
    });
    entityExplorer.SelectEntityByName("List1");
    cy.get(".t--widget-listwidget")
      .invoke("css", "height")
      .then((lheight) => {
        cy.get(commonlocators.generalSectionHeight).should("not.exist");
        entityExplorer.SelectEntityByName("Container1", "List1");
        entityExplorer.SelectEntityByName("Text1", "Container1");
        cy.get(commonlocators.generalSectionHeight).should("not.exist");
        cy.testCodeMirror(textMsg);
        entityExplorer.SelectEntityByName("Text2");
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
