const commonlocators = require("../../../../locators/commonlocators.json");
const dsl = require("../../../../fixtures/buttonApiDsl.json");
const widgetsPage = require("../../../../locators/Widgets.json");
const publishPage = require("../../../../locators/publishWidgetspage.json");
let dataSet;

describe("Test Create Api and Bind to Button widget", function () {
  before("Test_Add users api and execute api", () => {
    cy.addDsl(dsl);
    cy.fixture("example").then(function (data) {
      dataSet = data;
      cy.createAndFillApi(dataSet.userApi, "/random");
      cy.RunAPI();
    });
  });

  it("1. Call the api without error handling", () => {
    cy.SearchEntityandOpen("Button1");
    cy.get(widgetsPage.toggleOnClick)
      .invoke("attr", "class")
      .then((classes) => {
        if (classes.includes("is-active")) {
          cy.get(widgetsPage.toggleOnClick).click();
        }
      });
    cy.get(widgetsPage.toggleOnClick).click();

    cy.get(".t--property-control-onclick").then(($el) => {
      cy.updateCodeInput($el, "{{Api1.run()}}");
    });

    cy.PublishtheApp();

    cy.wait(3000);
    cy.get("span:contains('Submit')").closest("div").click();

    cy.wait("@postExecute").should(
      "have.nested.property",
      "response.body.responseMeta.status",
      200,
    );

    cy.get(commonlocators.toastAction)
      .should("have.length", 1)
      .should("contain.text", "failed to execute");

    cy.get(publishPage.backToEditor).click({ force: true });
  });

  it("2. Call the api with error handling", () => {
    cy.SearchEntityandOpen("Button1");

    cy.get(".t--property-control-onclick").then(($el) => {
      cy.updateCodeInput($el, "{{Api1.run(() => {}, () => {})}}");
    });

    cy.PublishtheApp();

    cy.wait(3000);
    cy.get("span:contains('Submit')").closest("div").click();

    cy.wait("@postExecute").should(
      "have.nested.property",
      "response.body.responseMeta.status",
      200,
    );

    cy.get(commonlocators.toastAction).should("not.exist");
  });
});
