const commonlocators = require("../../../../locators/commonlocators.json");
const dsl = require("../../../../fixtures/listwidgetdsl.json");
const pages = require("../../../../locators/Pages.json");
const apiPage = require("../../../../locators/ApiEditor.json");
const publishPage = require("../../../../locators/publishWidgetspage.json");

describe("Test Create Api and Bind to Table widget", function() {
  let apiData;
  before(() => {
    cy.addDsl(dsl);
  });

  it("Test_Add users api and execute api", function() {
    cy.createAndFillApi(this.data.userApi, "/users");
    cy.RunAPI();
    cy.get(apiPage.responseBody)
      .contains("name")
      .siblings("span")
      .invoke("text")
      .then((text) => {
        const value = text.match(/"(.*)"/)[0];
        cy.log(value);

        apiData = value;
        cy.log("val1:" + value);
      });
  });

  it("Test_Validate the Api data is updated on List widget", function() {
    cy.SearchEntityandOpen("List1");
    cy.getCodeMirror().then(($cm) => {
      cy.get(".CodeMirror textarea")
        .first()
        .type(`{{Api1.data.users}}`, {
          force: true,
          parseSpecialCharSequences: false,
        });
    });
    cy.get(commonlocators.editPropCrossButton).click({ force: true });
    cy.get(".t--draggable-textwidget span").should("have.length", 4);

    cy.get(".t--draggable-textwidget span")
      .first()
      .invoke("text")
      .then((text) => {
        expect(text).to.equal("Barty Crouch");
      });
    cy.PublishtheApp();
    cy.get(".t--widget-textwidget span").should("have.length", 4);
    cy.get(".t--widget-textwidget span")
      .first()
      .invoke("text")
      .then((text) => {
        expect(text).to.equal("Barty Crouch");
      });
  });

  it("Test_Validate the list widget ", function() {
    cy.get(publishPage.backToEditor).click({ force: true });
    cy.SearchEntityandOpen("List1");

    cy.getCodeMirror().then(($cm) => {
      cy.get(".CodeMirror textarea")
        .last()
        .type(`50`, {
          force: true,
          parseSpecialCharSequences: false,
        });
    });
    cy.get(commonlocators.editPropCrossButton).click({ force: true });
    cy.get(".t--draggable-textwidget span").should("have.length", 2);
    cy.get(".t--draggable-textwidget span")
      .first()
      .invoke("text")
      .then((text) => {
        expect(text).to.equal("Barty Crouch");
      });
    cy.PublishtheApp();
    cy.get(".t--widget-textwidget span").should("have.length", 2);
    cy.get(".t--widget-textwidget span")
      .first()
      .invoke("text")
      .then((text) => {
        expect(text).to.equal("Barty Crouch");
      });
  });

  afterEach(() => {
    // put your clean up code if any
  });
});
