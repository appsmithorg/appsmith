const dsl = require("../../../../fixtures/DynamicHeightListTextDsl.json");
const commonlocators = require("../../../../locators/commonlocators.json");
import { ObjectsRegistry } from "../../../../support/Objects/Registry";

const explorer = require("../../../../locators/explorerlocators.json");

const agHelper = ObjectsRegistry.AggregateHelper;

describe("Dynamic Height Width validation list widget", function () {
  afterEach(() => {
    agHelper.SaveLocalStorageCache();
  });

  beforeEach(() => {
    agHelper.RestoreLocalStorageCache();
  });
  it("Validate change with auto height width for list widgets", function () {
    const modifierKey = Cypress.platform === "darwin" ? "meta" : "ctrl";
    const textMsg = "Dynamic panel validation for text widget wrt height";
    cy.addDsl(dsl);
    cy.wait(3000); //for dsl to settle
    cy.get(explorer.addWidget).click();
    cy.dragAndDropToCanvas("multiselecttreewidget", { x: 300, y: 500 });
    cy.openPropertyPane("listwidget");
    //Widgets which were not possible to be added to list widget cannot be pasted/moved into the list widget with multitreeselect
    cy.openPropertyPane("multiselecttreewidget");
    cy.get("body").type(`{${modifierKey}}c`);
    cy.selectEntityByName("List1");
    cy.get("body").type(`{${modifierKey}}v`);
    cy.wait("@updateLayout").should(
      "have.nested.property",
      "response.body.responseMeta.status",
      200,
    );
    cy.get(".t--toast-action span").should(
      "contain.text",
      "This widget cannot be used inside the list widget.",
    );
    cy.get(".t--widget-listwidget")
      .invoke("css", "height")
      .then((lheight) => {
        //Widgets within list widget have no dynamic height
        cy.get(commonlocators.generalSectionHeight).should("not.exist");
        //Widgets within list widget in existing applications have no dynamic height
        cy.openPropertyPaneWithIndex("textwidget", 0);
        cy.get(commonlocators.generalSectionHeight).should("not.exist");
        cy.testCodeMirror(textMsg);
        cy.openPropertyPaneWithIndex("textwidget", 1);
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
        cy.selectEntityByName("Container1");
        cy.get(commonlocators.generalSectionHeight).should("not.exist");
        //Widgets when moved into the list widget have no dynamic height
        cy.selectEntityByName("Text3");
        cy.get("body").type(`{${modifierKey}}c`);
        cy.selectEntityByName("List1");
        cy.get("body").type(`{${modifierKey}}v`);
        cy.wait("@updateLayout").should(
          "have.nested.property",
          "response.body.responseMeta.status",
          200,
        );
        cy.wait(2000);
        cy.get("#switcher--explorer").click({ force: true });
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
        cy.selectEntityByName("Text3CopyCopy");
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
        cy.selectEntityByName("Text3CopyCopy");
        cy.wait(2000);
        cy.get("body").type(`{${modifierKey}}c`);
        cy.selectEntityByName("List1");
        cy.get("body").type(`{${modifierKey}}v`);
        cy.wait("@updateLayout").should(
          "have.nested.property",
          "response.body.responseMeta.status",
          200,
        );
        cy.wait(2000);
        //Widgets when copied and pasted into the list widget no longer have dynamic height
        cy.get(
          ".t--entity-item:contains('Container1') .t--entity-collapse-toggle",
        ).click({ force: true });
        cy.selectEntityByName("Text3CopyCopyCopy");
        cy.wait(2000);
        cy.get(commonlocators.generalSectionHeight).should("not.exist");
        cy.selectEntityByName("Text3CopyCopy");
        cy.wait(2000);
        cy.get("body").type(`{${modifierKey}}x`);
        cy.selectEntityByName("List1");
        cy.get("body").type(`{${modifierKey}}v`);
        cy.wait("@updateLayout").should(
          "have.nested.property",
          "response.body.responseMeta.status",
          200,
        );
        cy.wait(2000);
        cy.selectEntityByName("Text3CopyCopy");
        cy.wait(2000);
        cy.get(commonlocators.generalSectionHeight).should("not.exist");
      });
  });
});
