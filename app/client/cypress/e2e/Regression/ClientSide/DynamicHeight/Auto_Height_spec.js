const dsl = require("../../../../fixtures/dynamicHeightContainerCheckboxdsl.json");
const cdsl = require("../../../../fixtures/dynamicHeigthContainerFixedDsl.json");
const commonlocators = require("../../../../locators/commonlocators.json");
import {
  entityExplorer,
  agHelper,
} from "../../../../support/Objects/ObjectsCore";

describe("Dynamic Height Width validation", function () {
  afterEach(() => {
    agHelper.SaveLocalStorageCache();
  });

  beforeEach(() => {
    agHelper.RestoreLocalStorageCache();
  });

  it("1. Validate change with auto height width for widgets", function () {
    cy.addDsl(dsl);
    cy.wait(3000); //for dsl to settle
    entityExplorer.SelectEntityByName("Container1", "Widgets");
    entityExplorer.SelectEntityByName("CheckboxGroup1", "Container1");
    cy.moveToStyleTab();
    cy.get(".t--property-control-fontsize .rc-select")
      .invoke("css", "font-size")
      .then((dropdownFont) => {
        cy.get(".t--property-control-fontsize input").last().click({
          force: true,
        });
        cy.get(".rc-select-item-option-content")
          .should("have.length.greaterThan", 2)
          .its("length")
          .then((n) => {
            for (let i = 0; i < n; i++) {
              cy.get(".rc-select-item-option-content")
                .eq(i)
                .invoke("css", "font-size")
                .then((selectedFont) => {
                  expect(dropdownFont).to.equal(selectedFont);
                });
            }
          });
      });
    cy.get(".t--property-control-fontsize .rc-select")
      .invoke("css", "font-family")
      .then((dropdownFont) => {
        //cy.get(".t--property-control-fontsize .remixicon-icon").click({ force: true })
        cy.get(".t--dropdown-option span")
          .should("have.length.greaterThan", 2)
          .its("length")
          .then((n) => {
            for (let i = 0; i < n; i++) {
              cy.get(".t--dropdown-option span")
                .eq(i)
                .invoke("css", "font-family")
                .then((selectedFont) => {
                  expect(dropdownFont).to.equal(selectedFont);
                });
            }
          });
      });
    cy.moveToContentTab();
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

  it("2. Validate container with auto height and child widgets with fixed height", function () {
    cy.addDsl(cdsl);
    cy.wait(3000); //for dsl to settle
    entityExplorer.SelectEntityByName("CheckboxGroup1", "Container1");
    cy.get(commonlocators.generalSectionHeight)
      .scrollIntoView()
      .should("be.visible");
    cy.changeLayoutHeight(commonlocators.autoHeight);
    entityExplorer.SelectEntityByName("Input1");
    cy.get(commonlocators.generalSectionHeight)
      .scrollIntoView()
      .should("be.visible");
    cy.changeLayoutHeight(commonlocators.autoHeight);
    cy.get(".t--widget-containerwidget")
      .invoke("css", "height")
      .then((height) => {
        entityExplorer.SelectEntityByName("Container1", "Widgets");
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
