const dsl = require("../../../../fixtures/dynamicHeightContainer.json");
const commonlocators = require("../../../../locators/commonlocators.json");
const cdsl = require("../../../../fixtures/multipleContainerdsl.json");
const tdsl = require("../../../../fixtures/textWidgetDynamicdsl.json");
const invidsl = require("../../../../fixtures/invisbleWidgetdsl.json");
const widgetsPage = require("../../../../locators/Widgets.json");
const publishPage = require("../../../../locators/publishWidgetspage.json");

describe("Dynamic Height Width validation", function () {
    /*
    it("1. Validate change in auto height width for widgets", function () {
        cy.addDsl(dsl);
        cy.wait(3000); //for dsl to settle
        cy.openPropertyPane("containerwidget");
        cy.changeLayoutHeight(commonlocators.autoHeight);
        cy.openPropertyPane("checkboxgroupwidget");
        cy.changeLayoutHeight(commonlocators.autoHeight);
        cy.get(".t--widget-containerwidget").invoke("css", "height")
            .then((height) => {
                cy.get(".t--property-control-options-add").click();
                cy.get(".t--widget-checkboxgroupwidget").invoke("css", "height")
                  .then((checkboxheight) => {
                cy.wait("@updateLayout").should(
                    "have.nested.property",
                    "response.body.responseMeta.status",
                    200,
                  );
                  cy.get(".t--widget-checkboxgroupwidget").invoke("css", "height")
                  .then((newcheckboxheight) => {
                    expect(checkboxheight).to.not.equal(newcheckboxheight);
                  });
                });
                cy.wait(2000);
                cy.get(".t--widget-containerwidget").invoke("css", "height")
                    .then((newheight) => {
                        expect(height).to.not.equal(newheight);
                    });
            });
    });
    */
    /*
     it("2. Validate change in auto height with limits width for widgets", function () {
         cy.addDsl(dsl);
         cy.wait(3000); //for dsl to settle
         cy.openPropertyPane("containerwidget");
         cy.changeLayoutHeight(commonlocators.autoHeightWithLimits);
         cy.wait(3000); //for dsl to settle
         //cy.checkDefaultValue("minheight\\(inrows\\)","4")
         cy.contains("4");
         cy.testJsontext("minheight\\(inrows\\)","5");
         //cy.checkDefaultValue("minheight\\(inrows\\)","49")
         cy.contains("40");
         cy.testJsontext("maxheight\\(inrows\\)","60");
         cy.changeLayoutHeight(commonlocators.fixed);
         cy.changeLayoutHeight(commonlocators.autoHeightWithLimits);
         cy.contains("4");
         cy.contains("40");
     });
     */
    /*
        it("3. Validate change in auto height width with multiple containers", function () {
            cy.addDsl(cdsl);
            cy.wait(3000); //for dsl to settle
            cy.openPropertyPaneWithIndex("containerwidget", 0);
            cy.changeLayoutHeight(commonlocators.fixed);
            cy.changeLayoutHeight(commonlocators.autoHeight);
            cy.openPropertyPaneWithIndex("containerwidget", 1);
            cy.changeLayoutHeight(commonlocators.fixed);
            cy.changeLayoutHeight(commonlocators.autoHeight);
            cy.openPropertyPane("checkboxgroupwidget");
            cy.changeLayoutHeight(commonlocators.fixed);
            cy.changeLayoutHeight(commonlocators.autoHeight);
            cy.get(".t--widget-containerwidget").eq(0).invoke("css", "height")
                .then((oheight) => {
                    cy.get(".t--widget-containerwidget").eq(1).invoke("css", "height")
                        .then((mheight) => {
                            cy.get(".t--widget-containerwidget").eq(2).invoke("css", "height")
                                .then((iheight) => {
                                    cy.get(".t--property-control-options-add").click();
                                    cy.get(".t--widget-checkboxgroupwidget").invoke("css", "height")
                                        .then((checkboxheight) => {
                                            cy.wait("@updateLayout").should(
                                                "have.nested.property",
                                                "response.body.responseMeta.status",
                                                200,
                                            );
                                            cy.get(".t--widget-checkboxgroupwidget").invoke("css", "height")
                                                .then((newcheckboxheight) => {
                                                    expect(checkboxheight).to.not.equal(newcheckboxheight);
                                                });
                                        });
                                    cy.wait(2000);
                                    cy.get(".t--widget-containerwidget").eq(0).invoke("css", "height")
                                        .then((onewheight) => {
                                            expect(oheight).to.not.equal(onewheight);
                                        });
                                    cy.get(".t--widget-containerwidget").eq(1).invoke("css", "height")
                                        .then((mnewheight) => {
                                            expect(mheight).to.not.equal(mnewheight);
                                        });
                                    cy.get(".t--widget-containerwidget").eq(2).invoke("css", "height")
                                        .then((inewheight) => {
                                            expect(iheight).to.not.equal(inewheight);
                                        });
    
                                })
                        })
                })
    
        });
        */
    it("4.Text widget validation of height with dynamic height feature", function () {
        cy.addDsl(tdsl);
        //changing the Text Name and verifying
        cy.widgetText(
            this.data.TextName,
            widgetsPage.textWidget,
            widgetsPage.textWidget + " " + commonlocators.widgetNameTag,
        );
        cy.changeLayoutHeight(commonlocators.autoHeight);
        cy.get(".t--widget-textwidget").eq(0).invoke("css", "height")
            .then((theight) => {
                //Changing the text label
                cy.testCodeMirror(this.data.TextLabelValue);
                cy.moveToStyleTab();
                cy.ChangeTextStyle(
                    this.data.TextHeading,
                    commonlocators.headingTextStyle,
                    this.data.TextLabelValue,
                );
                cy.wait("@updateLayout");
                cy.get(".t--widget-textwidget").invoke("css", "height")
                    .then((tnewheight) => {
                        expect(theight).to.not.equal(tnewheight);
                    });
                cy.PublishtheApp();
                cy.get(commonlocators.headingTextStyle)
                    .should("have.text", this.data.TextLabelValue)
                    .should("have.css", "font-size", "16px");
                cy.get(".t--widget-textwidget").invoke("css", "height")
                    .then((tnewheight) => {
                        expect(theight).to.not.equal(tnewheight);
                    });
            });
    });
});
