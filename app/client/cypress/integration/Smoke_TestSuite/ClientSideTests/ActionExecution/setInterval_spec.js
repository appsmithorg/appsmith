const commonlocators = require("../../../../locators/commonlocators.json");
const dsl = require("../../../../fixtures/buttonApiDsl.json");
const widgetsPage = require("../../../../locators/Widgets.json");
const publishPage = require("../../../../locators/publishWidgetspage.json");

describe("Test Create Api and Bind to Table widget", function() {
  before(() => {
    cy.addDsl(dsl);
  });

  it("Test_Add users api and execute api", function() {
    cy.createAndFillApi(this.data.userApi, "/users");
    cy.RunAPI();
  });

  it("Fill button and test code generated", () => {
    cy.SearchEntityandOpen("Button1");
    cy.get(widgetsPage.buttonOnClick)
      .last()
      .click({ force: true });
    cy.get(commonlocators.chooseAction)
      .children()
      .contains("Set interval")
      .click();

    cy.get("label")
      .contains("Callback function")
      .parent()
      .then(($el) => {
        cy.updateCodeInput($el, "{{() => { Api1.run() }}}");
      });

    cy.get("label")
      .contains("Id")
      .parent()
      .then(($el) => {
        cy.updateCodeInput($el, "myInterval");
      });

    cy.get(widgetsPage.toggleOnClick).click();

    cy.get(".t--property-control-onclick")
      .find(".CodeMirror-code")
      .invoke("text")
      .should(
        "equal",
        "{{setInterval(() => { Api1.run() }, 5000,'myInterval')}}",
      );

    cy.PublishtheApp();

    cy.get(publishPage.buttonWidget).click();

    cy.wait("@postExecute").should(
      "have.nested.property",
      "response.body.responseMeta.status",
      200,
    );
    cy.wait(5000);
    cy.wait("@postExecute").should(
      "have.nested.property",
      "response.body.responseMeta.status",
      200,
    );
  });
});
