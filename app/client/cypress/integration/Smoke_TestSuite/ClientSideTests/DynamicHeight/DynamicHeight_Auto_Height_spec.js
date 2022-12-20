const dsl = require("../../../../fixtures/dynamicHeightContainerCheckboxdsl.json");
const cdsl = require("../../../../fixtures/dynamicHeigthContainerFixedDsl.json");
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
    cy.addDsl(dsl);
    cy.wait(3000); //for dsl to settle
    cy.openPropertyPane("containerwidget");
    //cy.changeLayoutHeight(commonlocators.autoHeight);
    cy.openPropertyPane("checkboxgroupwidget");
    //cy.changeLayoutHeight(commonlocators.autoHeight);
    cy.get(".t--widget-containerwidget")
      .invoke("css", "height")
      .then((height) => {
        cy.get(".t--widget-checkboxgroupwidget")
          .invoke("css", "height")
          .then((checkboxheight) => {
            cy.get(commonlocators.addOption).click();
            cy.wait(200);
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
          .invoke("css", "height")
          .then((newheight) => {
            expect(height).to.not.equal(newheight);
          });
      });
  });

  it("Validate container with auto height and child widgets with fixed height", function() {
    cy.addDsl(cdsl);
    cy.wait(3000); //for dsl to settle
    //cy.openPropertyPane("containerwidget");
    //cy.changeLayoutHeight(commonlocators.autoHeight);
    cy.openPropertyPane("checkboxgroupwidget");
    cy.get(commonlocators.generalSectionHeight)
      .scrollIntoView()
      .should("be.visible");
    cy.changeLayoutHeight(commonlocators.autoHeight);
    cy.openPropertyPane("inputwidgetv2");
    cy.get(commonlocators.generalSectionHeight)
      .scrollIntoView()
      .should("be.visible");
    cy.changeLayoutHeight(commonlocators.autoHeight);
    cy.get(".t--widget-containerwidget")
      .invoke("css", "height")
      .then((height) => {
        cy.openPropertyPane("containerwidget");
        cy.changeLayoutHeight(commonlocators.autoHeight);
        cy.wait(4000);
        cy.get(".t--widget-containerwidget")
          .invoke("css", "height")
          .then((newheight) => {
            expect(height).to.not.equal(newheight);
          });
      });
  });
});
