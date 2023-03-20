const dsl = require("../../../../fixtures/conversionFrAutoLayoutDsl.json");
const commonlocators = require("../../../../locators/commonlocators.json");
import { ObjectsRegistry } from "../../../../support/Objects/Registry";
const agHelper = ObjectsRegistry.AggregateHelper;
let cheight;
let theight;
let cwidth;
let twidth;
let testHeight;
let mtestHeight;

describe("Auto conversion algorithm usecases", function () {

    afterEach(() => {
        agHelper.SaveLocalStorageCache();
    });

    beforeEach(() => {
        agHelper.RestoreLocalStorageCache();
    });
    it("Validate basic conversion algorithm usecases", function () {
        cy.addDsl(dsl);
        cy.wait(5000); //for dsl to settle
        //cy.openPropertyPane("containerwidget");
        cy.get("@getPage").then((httpResponse) => {
            const data = httpResponse.response.body.data;
            testHeight = data.layouts[0].dsl.bottomRow;
            //expect(testHeight).to.equal(380);
        });
        cy.wait(3000);
        cy.get("#t--layout-conversion-cta").click({force: true });
        cy.wait(2000);
        cy.get("button:contains('CONVERT')").click({force: true});
        cy.wait(2000);
        cy.get("button:contains('REFRESH THE APP')").click({force: true});
        cy.wait(2000);
        cy.wait("@updateLayout").should(
            "have.nested.property",
            "response.body.responseMeta.status",
            200,
          );
        cy.get(".ads-dialog-trigger:contains('USE THE SNAPSHOT')").click({force: true});
        cy.wait(5000);
        cy.get("button:contains('USE SNAPSHOT')").click({force: true});
        cy.wait(2000);
        cy.get("button:contains('REFRESH THE APP')").click({force: true});
        cy.wait("@updateLayout").should(
            "have.nested.property",
            "response.body.responseMeta.status",
            200,
          );
        cy.wait(20000);

        /*
        cy.get(".t--entity-name:contains('Container1')").click({ force: true });
        cy.get(".t--widget-containerwidget")
            .invoke("css", "height")
            .then((height) => {
                cy.get(".t--widget-tablewidgetv2")
                    .invoke("css", "height")
                    .then((newheight) => {

                        cy.PublishtheApp();
                        cy.get(".t--widget-containerwidget")
                            .invoke("css", "height")
                            .then((height) => {
                                cy.get(".t--widget-tablewidgetv2")
                                    .invoke("css", "height")
                                    .then((newheight) => {
                                        cheight = height;
                                        theight = newheight;
                                    });
                            });
                        cy.get(".t--widget-containerwidget")
                            .invoke("css", "width")
                            .then((width) => {
                                cy.get(".t--widget-tablewidgetv2")
                                    .invoke("css", "width")
                                    .then((newwidth) => {
                                        cwidth = width;
                                        twidth = newwidth;
                                    });
                            });

                        //expect(height).to.equal(newheight);
                    });
            });
            */
    });


});