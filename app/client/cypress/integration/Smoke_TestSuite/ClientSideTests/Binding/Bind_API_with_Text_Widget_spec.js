const commonlocators = require("../../../../locators/commonlocators.json");
const dsl = require("../../../../fixtures/textAPIBindingdsl.json");
const apiPage = require("../../../../locators/ApiEditor.json");

describe("Test Create Api and Bind to Text widget", function() {
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
});
