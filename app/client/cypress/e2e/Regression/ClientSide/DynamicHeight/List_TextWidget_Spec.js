const commonlocators = require("../../../../locators/commonlocators.json");
const explorer = require("../../../../locators/explorerlocators.json");
import {
  entityExplorer,
  agHelper,
} from "../../../../support/Objects/ObjectsCore";

describe("Dynamic Height Width validation list widget", function () {
  it("1. Validate change with auto height width for list widgets", function () {
    const modifierKey = Cypress.platform === "darwin" ? "meta" : "ctrl";
    const textMsg = "Dynamic panel validation for text widget wrt height";
    cy.fixture("DynamicHeightListTextDsl").then((val) => {
      agHelper.AddDsl(val);
    });
    cy.get(explorer.addWidget).click();
    cy.dragAndDropToCanvas("multiselecttreewidget", { x: 300, y: 500 });
    entityExplorer.SelectEntityByName("List1", "Widgets");
    //Widgets which were not possible to be added to list widget cannot be pasted/moved into the list widget with multitreeselect
    entityExplorer.SelectEntityByName("MultiTreeSelect1", "Widgets");
    cy.get("body").type(`{${modifierKey}}c`);
    cy.get(".Toastify__toast-body span").should("not.exist");
    entityExplorer.SelectEntityByName("List1", "Widgets");
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
        entityExplorer.SelectEntityByName("Container1", "List1");
        entityExplorer.SelectEntityByName("Text1", "Container1");

        cy.get(commonlocators.generalSectionHeight).should("not.exist");
        cy.testCodeMirror(textMsg);
        entityExplorer.SelectEntityByName("Container1", "List1");
        entityExplorer.SelectEntityByName("Text2", "Container1");
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
        entityExplorer.SelectEntityByName("Container1", "List1");

        cy.get(commonlocators.generalSectionHeight).should("not.exist");
        //Widgets when moved into the list widget have no dynamic height
        entityExplorer.SelectEntityByName("Text3", "Widgets");
        cy.moveToStyleTab();

        cy.get("body").type(`{${modifierKey}}c`);
        entityExplorer.SelectEntityByName("List1", "Widgets");
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
        cy.selectEntityByName("Text3Copy");
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
        entityExplorer.SelectEntityByName("Text3CopyCopy", "Widgets");
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
        entityExplorer.SelectEntityByName("Text3CopyCopy", "Widgets");
        cy.wait(2000);
        cy.get("body").type(`{${modifierKey}}c`);
        entityExplorer.SelectEntityByName("List1", "Widgets");
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
        entityExplorer.SelectEntityByName("Text3CopyCopyCopy", "Container1");
        cy.wait(2000);
        cy.get(commonlocators.generalSectionHeight).should("not.exist");
        entityExplorer.SelectEntityByName("Text3CopyCopy");
        cy.wait(2000);
        cy.get("body").type(`{${modifierKey}}x`);
        entityExplorer.SelectEntityByName("List1");
        cy.moveToStyleTab();
        cy.wait(500);
        cy.get("body").type(`{${modifierKey}}v`);
        cy.wait("@updateLayout").should(
          "have.nested.property",
          "response.body.responseMeta.status",
          200,
        );
        cy.wait(2000);
        entityExplorer.SelectEntityByName("Text3CopyCopy", "Widgets");
        cy.wait(2000);
        cy.get(commonlocators.generalSectionHeight).should("not.exist");
      });
  });
});
