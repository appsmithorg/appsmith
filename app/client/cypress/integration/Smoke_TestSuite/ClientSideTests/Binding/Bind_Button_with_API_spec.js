const commonlocators = require("../../../../locators/commonlocators.json");
const dsl = require("../../../../fixtures/buttonApiDsl.json");
const apiwidget = require("../../../../locators/apiWidgetslocator.json");
const widgetsPage = require("../../../../locators/Widgets.json");
const testdata = require("../../../../fixtures/testdata.json");
import apiPage from "../../../../locators/ApiEditor";

describe("Bind a button and Api usecase", function() {
  let apiData;
  let valueToTest;
  before(() => {
    cy.addDsl(dsl);
  });

  it("Add an API by binding a button in its header", function() {
    cy.createAndFillApi(this.data.userApi, "/users");
    cy.get(apiwidget.headerKey)
      .first()
      .click({ force: true })
      .type("key", { parseSpecialCharSequences: true });
    cy.get(apiwidget.headerValue)
      .first()
      .click({ force: true })
      .type("{{Button1.text", { parseSpecialCharSequences: true });
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

  it("Button-Name updation", function() {
    cy.SearchEntityandOpen("Button1");
    //changing the Button Name
    cy.widgetText(
      testdata.buttonName,
      widgetsPage.buttonWidget,
      widgetsPage.buttonWidget + " " + commonlocators.widgetNameTag,
    );
  });

  it("API datasource binding with button name validation", function() {
    cy.CheckAndUnfoldEntityItem("QUERIES/JS");
    cy.SearchEntityandOpen("Api1");
    cy.get(apiwidget.headerValue)
      .first()
      .invoke("text")
      .then((text) => {
        const someText = text;
        expect(someText).to.contains(testdata.buttonName);
      });
  });
});
