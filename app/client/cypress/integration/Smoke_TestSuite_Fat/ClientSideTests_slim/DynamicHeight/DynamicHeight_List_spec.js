const dsl = require("../../../../fixtures/dynamicHeightListDsl.json");
const commonlocators = require("../../../../locators/commonlocators.json");
import { ObjectsRegistry } from "../../../../support/Objects/Registry";
const agHelper = ObjectsRegistry.AggregateHelper;

describe("Dynamic Height Width validation", function() {
  afterEach(() => {
    agHelper.SaveLocalStorageCache();
  });

  beforeEach(() => {
    agHelper.RestoreLocalStorageCache();
  });
  it("Validate change with auto height width for widgets", function() {
    const textMsg = "Dynamic panel validation for text widget wrt height";
    cy.addDsl(dsl);
    cy.wait(3000); //for dsl to settle
    cy.openPropertyPane("listwidget");
    cy.get(".t--widget-listwidget")
      .invoke("css", "height")
      .then((lheight) => {
        cy.get(commonlocators.generalSectionHeight).should("not.exist");
        cy.openPropertyPaneWithIndex("textwidget", 0);
        cy.get(commonlocators.generalSectionHeight).should("be.visible");
        cy.changeLayoutHeightWithoutWait(commonlocators.autoHeight);
        cy.testCodeMirror(textMsg);
        cy.openPropertyPaneWithIndex("textwidget", 1);
        cy.get(commonlocators.generalSectionHeight).should("be.visible");
        cy.changeLayoutHeightWithoutWait(commonlocators.autoHeight);
        cy.testCodeMirror(textMsg);
        cy.get(".t--widget-listwidget")
          .invoke("css", "height")
          .then((newheight) => {
            expect(lheight).to.equal(newheight);
          });
      });
  });
});
