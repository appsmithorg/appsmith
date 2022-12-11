const dsl = require("../../../../fixtures/dynamicHeightListTextDsl.json");
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
        cy.openPropertyPane("multiselecttreewidget");
        cy.get("body").type(`{${modifierKey}}c`);
        cy.selectEntityByName("List1");
        cy.get("body").type(`{${modifierKey}}v`);
        cy.wait("@updateLayout").should(
            "have.nested.property",
            "response.body.responseMeta.status",
            200,
        );
        cy.get(".t--toast-action span")
            .should("contain.text", "This widget cannot be used inside the list widget.")
        cy.get(".t--widget-listwidget")
            .invoke("css", "height")
            .then((lheight) => {
                cy.get(commonlocators.generalSectionHeight).should("not.exist");
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
                cy.get(".t--entity-item:contains('List1') .t--entity-collapse-toggle").click({ force: true })
                cy.selectEntityByName("Container1");
                cy.get(commonlocators.generalSectionHeight).should("not.exist");
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
                cy.get("#switcher--explorer").click({force:true});
                cy.get(".t--entity-item:contains('Container1') .t--entity-collapse-toggle").click({ force: true })
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
                cy.selectEntityByName("Text3CopyCopy");
                cy.wait(2000);
                cy.get(commonlocators.generalSectionHeight).should("be.visible");
                cy.get(".t--widget-textwidget")
                    .last()
                    .invoke("css", "height")
                    .then((height) => {
                        cy.changeLayoutHeight(commonlocators.autoHeight);
                        cy.wait("@updateLayout").should(
                            "have.nested.property",
                            "response.body.responseMeta.status",
                            200,
                        );
                        cy.wait(3000);
                        cy.get(".t--widget-textwidget")
                            .last()
                            .invoke("css", "height")
                            .then((newheight) => {
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
                cy.get(".t--entity-item:contains('Container1') .t--entity-collapse-toggle").click({ force: true });
                cy.selectEntityByName("Text3CopyCopyCopy");
                cy.wait(2000);
                cy.get(commonlocators.generalSectionHeight).should("not.exist");
            });
    });

});
