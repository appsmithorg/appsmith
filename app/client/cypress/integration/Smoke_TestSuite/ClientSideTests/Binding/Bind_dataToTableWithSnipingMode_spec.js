const dsl = require("../../../../fixtures/tableWidgetDsl.json");
const apiPage = require("../../../../locators/ApiEditor.json");

describe("Test Create Api and Bind to Table widget", function() {
  let apiData;
  before(() => {
    cy.addDsl(dsl);
  });

  it("Test_Add users api, execute it and go to sniping mode.", function() {
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
    cy.get(".t--select-in-canvas").click();
    cy.get(".t--sniping-mode-banner").should("be.visible");
  });

  it("Click on table name controller to bind the data and exit sniping mode", function() {
    cy.get(".t--settings-sniping-control").click();
    cy.get(".t--property-control-tabledata .CodeMirror").contains(
      "{{Api1.data}}",
    );
    cy.get(".t--sniping-mode-banner").should("not.exist");
  });

  afterEach(() => {
    // put your clean up code if any
  });
});
