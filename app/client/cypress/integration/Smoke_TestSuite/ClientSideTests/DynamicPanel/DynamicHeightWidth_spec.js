const dsl = require("../../../../fixtures/dynamicHeightContainer.json");
const commonlocators = require("../../../../locators/commonlocators.json");
const cdsl = require("../../../../fixtures/multipleContainerdsl.json");
const tdsl = require("../../../../fixtures/textWidgetDynamicdsl.json");
const invidsl = require("../../../../fixtures/invisbleWidgetdsl.json");
const tabdsl = require("../../../../fixtures/dynamicTabWidgetdsl.json");
import { ObjectsRegistry } from "../../../../support/Objects/Registry";
var appId = " ";
let homePage = ObjectsRegistry.HomePage,
  agHelper = ObjectsRegistry.AggregateHelper;
/*
describe("Dynamic Height Width validation", function () {

    before(() => {
        appId = localStorage.getItem("applicationId");
        cy.log("appID:"+appId);
        cy.addDsl(dsl, appId);
      });
    
    before(function () {
        agHelper.RestoreLocalStorageCache();
    });

    before(() => {
        appId = localStorage.getItem("applicationId");
        cy.log("appID:"+appId);
        cy.addDsl(dsl, appId);
      });
    
    beforeEach(function () {
        agHelper.RestoreLocalStorageCache();
    });

    afterEach(function () {
        agHelper.SaveLocalStorageCache();
    });
    
    after(function () {
        agHelper.SaveLocalStorageCache();
    });
    it("1. Validate change in auto height width for widgets", function () {
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

});

describe("Dynamic Height Width validation with limits", function () {
    /*
    beforeEach(function () {
        agHelper.RestoreLocalStorageCache();
    });

    afterEach(function () {
        agHelper.SaveLocalStorageCache();
    });
    before(() => {
        cy.addDsl(dsl);
    });

      before(() => {
        appId = localStorage.getItem("applicationId");
        cy.log("appID:"+appId);
        cy.addDsl(dsl, appId);
      });

    
    it("Validate change in auto height with limits width for widgets", function () {
        cy.wait(3000); //for dsl to settle
        cy.openPropertyPane("containerwidget");
        cy.changeLayoutHeight(commonlocators.autoHeightWithLimits);
        cy.wait(3000); //for dsl to settle
        //cy.checkDefaultValue("minheight\\(inrows\\)","4")
        cy.contains("4");
        cy.testJsontext("minheight\\(inrows\\)", "5");
        //cy.checkDefaultValue("minheight\\(inrows\\)","49")
        cy.contains("40");
        cy.testJsontext("maxheight\\(inrows\\)", "60");
        cy.changeLayoutHeight(commonlocators.fixed);
        cy.changeLayoutHeight(commonlocators.autoHeightWithLimits);
        cy.contains("4");
        cy.contains("40");
    });
});

describe("Dynamic Height Width validation for multipple container", function () {
    beforeEach(function () {
        agHelper.RestoreLocalStorageCache();
    });

    afterEach(function () {
        agHelper.SaveLocalStorageCache();
    });

    before(() => {
        cy.addDsl(cdsl);
    });

    before(() => {
        appId = localStorage.getItem("applicationId");
        cy.log("appID:"+appId);
        cy.addDsl(cdsl, appId);
      });
    it("Validate change in auto height width with multiple containers", function () {
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

});

describe("Dynamic Height Width validation for text widget", function () {
    beforeEach(function () {
        agHelper.RestoreLocalStorageCache();
    });

    afterEach(function () {
        agHelper.SaveLocalStorageCache();
    });

    before(() => {
        cy.addDsl(tdsl);
    });

    before(() => {
        appId = localStorage.getItem("applicationId");
        cy.log("appID:"+appId);
        cy.addDsl(cdsl, appId);
      });
    it("Text widget validation of height with dynamic height feature", function () {
        const textMsg = "Dynamic panel validation for text widget wrt height";
        //changing the Text Name and verifying
        cy.openPropertyPane("textwidget");
        cy.changeLayoutHeightWithoutWait(commonlocators.autoHeight);
        cy.get(".t--widget-textwidget").invoke("css", "height")
            .then((theight) => {
                //Changing the text label
                cy.testCodeMirror(textMsg);
                cy.moveToStyleTab();
                cy.ChangeTextStyle(
                    this.data.TextHeading,
                    commonlocators.headingTextStyle,
                    textMsg,
                );
                cy.wait("@updateLayout");
                cy.get(".t--widget-textwidget").invoke("css", "height")
                    .then((tnewheight) => {
                        expect(theight).to.not.equal(tnewheight);
                    });
                cy.PublishtheApp();
                cy.get(commonlocators.headingTextStyle)
                    .should("have.text", textMsg)
                    .should("have.css", "font-size", "16px");
                cy.get(".t--widget-textwidget").invoke("css", "height")
                    .then((tnewheight) => {
                        expect(theight).to.not.equal(tnewheight);
                    });
            });
    });
});

describe("Dynamic Height Width validation for Invisiblity", function () {
    before(() => {
        cy.addDsl(invidsl);
    });
    it("Text widget validation of height with dynamic height feature", function () {
        //changing the Text Name and verifying
        cy.wait(3000);
        cy.openPropertyPane("containerwidget");
        cy.changeLayoutHeightWithoutWait(commonlocators.autoHeight);
        cy.get(".t--widget-containerwidget").invoke("css", "height")
            .then((theight) => {
                cy.get(".t--draggable-checkboxwidget .bp3-control-indicator").click({ force: true })
                cy.get(".t--widget-containerwidget").invoke("css", "height")
                    .then((tnewheight) => {
                        expect(theight).to.equal(tnewheight);
                        //cy.get("label:Contains('OFF')").should("be.visible");
                        cy.get("label:Contains('ON')").should("not.be.enabled")
                    });
            });
        cy.PublishtheApp();
        cy.get(".t--widget-containerwidget").invoke("css", "height")
            .then((theight) => {
                cy.get(".bp3-control-indicator").click({ force: true })
                cy.get(".t--widget-containerwidget").invoke("css", "height")
                    .then((tnewheight) => {
                        expect(theight).to.equal(tnewheight);
                        cy.get("label:Contains('ON')").should("not.be.enabled")
                        //cy.get("label:Contains('Off')").should("be.visible");
                    });
            });
    });
});
*/

describe("Dynamic Height Width validation for Tab widget", function() {
  before(() => {
    cy.addDsl(tabdsl);
  });
  it("Tab widget validation of height with dynamic height feature", function() {
    //changing the Text Name and verifying
    cy.wait(3000);
    cy.openPropertyPane("tabswidget");
    cy.changeLayoutHeightWithoutWait(commonlocators.autoHeight);
    cy.get(".t--tabid-tab1").click({ force: true });
    cy.wait(3000);
    cy.get(".t--widget-tabswidget")
      .invoke("css", "height")
      .then((theight) => {
        cy.get(".t--tabid-tab2").click({ force: true });
        cy.wait(3000);
        cy.wait("@updateLayout").should(
          "have.nested.property",
          "response.body.responseMeta.status",
          200,
        );
        //cy.get(".t--draggable-checkboxwidget .bp3-control-indicator").click({ force: true })
        cy.get(".t--widget-tabswidget")
          .invoke("css", "height")
          .then((tnewheight) => {
            expect(theight).to.not.equal(tnewheight);
            cy.reload();
            cy.openPropertyPane("tabswidget");
            expect(theight).to.equal(theight);
          });
      });
    cy.changeLayoutHeight(commonlocators.fixed);
    cy.get(".t--tabid-tab1").click({ force: true });
    cy.wait(3000);
    cy.get(".t--widget-tabswidget")
      .invoke("css", "height")
      .then((theight) => {
        cy.get(".t--tabid-tab2").click({ force: true });
        cy.wait(3000);
        //cy.get(".t--draggable-checkboxwidget .bp3-control-indicator").click({ force: true })
        cy.get(".t--widget-tabswidget")
          .invoke("css", "height")
          .then((tnewheight) => {
            expect(theight).to.equal(tnewheight);
            cy.get(
              ".t--property-control-showtabs .bp3-control-indicator",
            ).click({ force: true });
            cy.wait("@updateLayout").should(
              "have.nested.property",
              "response.body.responseMeta.status",
              200,
            );
            cy.get(".t--widget-tabswidget")
              .invoke("css", "height")
              .then((upheight) => {
                expect(tnewheight).to.equal(upheight);
                cy.get(".t--tabid-tab1").should("not.exist");
                cy.get(".t--tabid-tab2").should("not.exist");
              });
          });
      });
  });
});
