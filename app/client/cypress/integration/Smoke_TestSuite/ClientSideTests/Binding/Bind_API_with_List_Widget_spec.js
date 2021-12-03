const commonlocators = require("../../../../locators/commonlocators.json");
const dsl = require("../../../../fixtures/listwidgetdsl.json");
const pages = require("../../../../locators/Pages.json");
const apiPage = require("../../../../locators/ApiEditor.json");
const publishPage = require("../../../../locators/publishWidgetspage.json");

describe("Test Create Api and Bind to Table widget", function() {
  let apiData;
  let valueToTest;
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
        valueToTest = `${text
          .match(/"(.*)"/)[0]
          .split('"')
          .join("")}`;
        cy.log(valueToTest);
        apiData = valueToTest;
        cy.log("val1:" + valueToTest);
      });
  });

  it("Test_Validate the Api data is updated on List widget", function() {
    cy.SearchEntityandOpen("List1");
    cy.testJsontext("items", "{{Api1.data.users}}");
    cy.get(".t--draggable-textwidget span").should("have.length", 8);

    cy.get(".t--draggable-textwidget span")
      .first()
      .invoke("text")
      .then((text) => {
        expect(text).to.equal(valueToTest);
      });
    cy.PublishtheApp();
    cy.get(".t--widget-textwidget span").should("have.length", 8);
    cy.get(".t--widget-textwidget span")
      .first()
      .invoke("text")
      .then((text) => {
        expect(text).to.equal(valueToTest);
      });
  });

  it("Test_Validate the list widget ", function() {
    cy.get(publishPage.backToEditor).click({ force: true });
    cy.SearchEntityandOpen("List1");
    cy.testJsontext("itemspacing\\(px\\)", "50");
    cy.get(".t--draggable-textwidget span").should("have.length", 6);
    cy.get(".t--draggable-textwidget span")
      .first()
      .invoke("text")
      .then((text) => {
        expect(text).to.equal(valueToTest);
      });
    cy.PublishtheApp();
    cy.get(".t--widget-textwidget span").should("have.length", 6);
    cy.get(".t--widget-textwidget span")
      .first()
      .invoke("text")
      .then((text) => {
        expect(text).to.equal(valueToTest);
      });
  });

  afterEach(() => {
    // put your clean up code if any
  });
});
