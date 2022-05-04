const testdata = require("../../../../fixtures/testdata.json");
const apiwidget = require("../../../../locators/apiWidgetslocator.json");
const dsl = require("../../../../fixtures/MultipleInput.json");
const widgetsPage = require("../../../../locators/Widgets.json");
const publish = require("../../../../locators/publishWidgetspage.json");

describe("Binding the API with pageOnLoad and input Widgets", function() {
  before(() => {
    cy.addDsl(dsl);
  });

  it("1. Will load an api on load", function() {
    cy.NavigateToAPI_Panel();
    cy.CreateAPI("PageLoadApi");
    cy.enterDatasourceAndPath(testdata.baseUrl, testdata.methods);
    cy.WaitAutoSave();
    cy.get(apiwidget.settings).click({ force: true });
    cy.get(apiwidget.onPageLoad).click({ force: true });
    cy.wait("@setExecuteOnLoad");
    cy.reload();
  });

  it("2. Input widget updated with deafult data", function() {
    cy.selectEntityByName("WIDGETS");
    cy.selectEntityByName("Input1");
    cy.get(widgetsPage.defaultInput).type("3");

    cy.wait("@updateLayout").should(
      "have.nested.property",
      "response.body.responseMeta.status",
      200,
    );
    cy.get(publish.inputWidget + " " + "input")
      .first()
      .invoke("attr", "value")
      .should("contain", "3");
  });

  it("3. Binding second input widget with API on PageLoad data and default data from input1 widget ", function() {
    cy.selectEntityByName("Input3");
    cy.get(widgetsPage.defaultInput).type(testdata.pageloadBinding, {
      parseSpecialCharSequences: false,
    });

    cy.wait("@updateLayout").should(
      "have.nested.property",
      "response.body.responseMeta.status",
      200,
    );
    cy.PublishtheApp();
    cy.get(publish.inputWidget + " " + "input")
      .first()
      .invoke("attr", "value")
      .should("contain", "3");
    cy.get(publish.inputWidget + " " + "input")
      .last()
      .invoke("attr", "value")
      .should("contain", "23");
    cy.get(publish.backToEditor).click();
  });
});
