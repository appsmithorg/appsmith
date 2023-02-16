const commonlocators = require("../../../../locators/commonlocators.json");
const dsl = require("../../../../fixtures/buttonApiDsl.json");
const widgetsPage = require("../../../../locators/Widgets.json");
const publishPage = require("../../../../locators/publishWidgetspage.json");

describe("Test Create Api and Bind to Button widget", function() {
  before(() => {
    cy.addDsl(dsl);
  });

  it("1. Test_Add users api and execute api", function() {
    cy.createAndFillApi(this.data.userApi, "/mock-api?records=10");
    cy.RunAPI();
  });

  it("2. Selects set interval function", () => {
    cy.SearchEntityandOpen("Button1");
    cy.get(widgetsPage.buttonOnClick)
      .last()
      .click({ force: true });
    cy.get(commonlocators.chooseAction)
      .children()
      .contains("Set interval")
      .click();
  });

  it("3. Fill setInterval action creator and test code generated", () => {
    cy.get(widgetsPage.toggleOnClick)
      .invoke("attr", "class")
      .then((classes) => {
        if (classes.includes("is-active")) {
          cy.get(widgetsPage.toggleOnClick).click();
        }
      });

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

    cy.get(widgetsPage.toggleOnClick).click();
  });

  it("4. Works in the published version", () => {
    cy.PublishtheApp();
    cy.wait(3000);
    cy.get("span:contains('Submit')")
      .closest("div")
      .click();
    cy.wait("@postExecute").should(
      "have.nested.property",
      "response.body.responseMeta.status",
      200,
    );
    cy.wait(3000);

    cy.wait("@postExecute").should(
      "have.nested.property",
      "response.body.responseMeta.status",
      200,
    );
    cy.get(publishPage.backToEditor).click({ force: true });
  });

  it("5. Selects clear interval function", () => {
    cy.SearchEntityandOpen("Button1");
    cy.get(widgetsPage.buttonOnClick)
      .last()
      .click({ force: true });
    cy.get(commonlocators.chooseAction)
      .children()
      .contains("Clear interval")
      .click();
  });

  it("6. Fill clearInterval action creator and test code generated", () => {
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
      .should("equal", "{{clearInterval('myInterval')}}");
  });
});
