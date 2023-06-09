const dsl = require("../../../../fixtures/DynamicHeightListTextDsl.json");
const commonlocators = require("../../../../locators/commonlocators.json");
import { ObjectsRegistry } from "../../../../support/Objects/Registry";
import * as _ from "../../../../support/Objects/ObjectsCore";
const explorer = require("../../../../locators/explorerlocators.json");

const entityExplorer = ObjectsRegistry.EntityExplorer;

describe("Dynamic Height Width validation list widget", function () {
  it("1. Validate change with auto height width for list widgets", function () {
    const modifierKey = Cypress.platform === "darwin" ? "meta" : "ctrl";
    const textMsg = "Dynamic panel validation for text widget wrt height";
    cy.addDsl(dsl);
    cy.wait(3000); //for dsl to settle
    cy.get(explorer.addWidget).click();
    cy.dragAndDropToCanvas("multiselecttreewidget", { x: 300, y: 500 });
    _.entityExplorer.SelectEntityByName("List1", "Widgets");
    //Widgets which were not possible to be added to list widget cannot be pasted/moved into the list widget with multitreeselect
    _.entityExplorer.SelectEntityByName("MultiTreeSelect1", "Widgets");
    cy.get("body").type(`{${modifierKey}}c`);
    cy.get(".Toastify__toast-body span").should("not.exist");
    _.entityExplorer.SelectEntityByName("List1", "Widgets");
    cy.moveToStyleTab();
    cy.get("body").type(`{${modifierKey}}v`);
    cy.wait("@updateLayout").should(
      "have.nested.property",
      "response.body.responseMeta.status",
      200,
    );
    cy.get(".Toastify__toast-body span").should(
      "contain.text",
      "This widget cannot be used inside the list widget.",
    );
    cy.get(".t--widget-listwidget")
      .invoke("css", "height")
      .then((lheight) => {
        //Widgets within list widget have no dynamic height
        cy.get(commonlocators.generalSectionHeight).should("not.exist");
        //Widgets within list widget in existing applications have no dynamic height
        _.entityExplorer.SelectEntityByName("Container1", "List1");
        _.entityExplorer.SelectEntityByName("Text1", "Container1");

        cy.get(commonlocators.generalSectionHeight).should("not.exist");
        cy.testCodeMirror(textMsg);
        _.entityExplorer.SelectEntityByName("Container1", "List1");
        _.entityExplorer.SelectEntityByName("Text2", "Container1");
        cy.get(commonlocators.generalSectionHeight).should("not.exist");
        cy.testCodeMirror(textMsg);
        cy.get(".t--widget-listwidget")
          .invoke("css", "height")
          .then((newheight) => {
            expect(lheight).to.equal(newheight);
          });
        cy.get(
          ".t--entity-item:contains('List1') .t--entity-collapse-toggle",
        ).click({ force: true });
        _.entityExplorer.SelectEntityByName("Container1", "List1");

        cy.get(commonlocators.generalSectionHeight).should("not.exist");
        //Widgets when moved into the list widget have no dynamic height
        _.entityExplorer.SelectEntityByName("Text3", "Widgets");
        cy.moveToStyleTab();

        cy.get("body").type(`{${modifierKey}}c`);
        _.entityExplorer.SelectEntityByName("List1", "Widgets");
        cy.moveToStyleTab();
        cy.wait(500);
        cy.get("body").type(`{${modifierKey}}v`);
        cy.wait("@updateLayout").should(
          "have.nested.property",
          "response.body.responseMeta.status",
          200,
        );
        cy.wait(2000);
        entityExplorer.NavigateToSwitcher("Explorer");
        _.entityExplorer.SelectEntityByName("List1", "Widgets");
        _.entityExplorer.SelectEntityByName("Container1", "List1");
        _.entityExplorer.SelectEntityByName("Text3Copy", "Container1");

        cy.get(commonlocators.generalSectionHeight).should("not.exist");
        cy.get("body").type(`{${modifierKey}}c`);
        cy.get("[data-testid='div-selection-0']").click({ force: true });
        cy.get("body").type(`{${modifierKey}}v`);
        cy.wait("@updateLayout").should(
          "have.nested.property",
          "response.body.responseMeta.status",
          200,
        );
        //Widgets when moved out of the list widget have dynamic height in property pane
        _.entityExplorer.SelectEntityByName("Text3CopyCopy", "Widgets");
        cy.wait(2000);
        cy.get(commonlocators.generalSectionHeight).should("be.visible");
        cy.get(".t--widget-textwidget").first().click({ force: true });
        cy.get(".t--widget-textwidget")
          .first()
          .invoke("css", "height")
          .then((height) => {
            cy.log("height", height);
            cy.changeLayoutHeight(commonlocators.autoHeight);
            cy.wait("@updateLayout").should(
              "have.nested.property",
              "response.body.responseMeta.status",
              200,
            );
            cy.wait(3000);
            cy.get(".t--widget-textwidget").first().click({ force: true });
            cy.get(".t--widget-textwidget")
              .first()
              .wait(1000)
              .invoke("css", "height")
              .then((newheight) => {
                cy.log("newheight", newheight);
                expect(height).to.not.equal(newheight);
              });
          });
        _.entityExplorer.SelectEntityByName("Text3CopyCopy", "Widgets");
        cy.wait(2000);
        cy.get("body").type(`{${modifierKey}}c`);
        _.entityExplorer.SelectEntityByName("List1", "Widgets");
        cy.moveToStyleTab();
        cy.wait(500);
        cy.get("body").type(`{${modifierKey}}v`);
        cy.wait("@updateLayout").should(
          "have.nested.property",
          "response.body.responseMeta.status",
          200,
        );
        cy.wait(2000);

        //Widgets when copied and pasted into the list widget no longer have dynamic height
        _.entityExplorer.SelectEntityByName("Text3CopyCopyCopy", "Container1");
        cy.wait(2000);
        cy.get(commonlocators.generalSectionHeight).should("not.exist");
        _.entityExplorer.SelectEntityByName("Text3CopyCopy", "Widgets");
        cy.wait(2000);
        cy.get("body").type(`{${modifierKey}}x`);
        _.entityExplorer.SelectEntityByName("List1", "Widgets");
        cy.moveToStyleTab();
        cy.wait(500);
        cy.get("body").type(`{${modifierKey}}v`);
        cy.wait("@updateLayout").should(
          "have.nested.property",
          "response.body.responseMeta.status",
          200,
        );
        cy.wait(2000);
        _.entityExplorer.SelectEntityByName("Container1", "List1");
        _.entityExplorer.SelectEntityByName("Text3CopyCopy", "Widgets");
        cy.wait(2000);
        cy.get(commonlocators.generalSectionHeight).should("not.exist");
      });
  });
});
