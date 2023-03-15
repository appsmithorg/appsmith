const commonlocators = require("../../../../locators/commonlocators.json");
const dsl = require("../../../../fixtures/buttonApiDsl.json");
const widgetsPage = require("../../../../locators/Widgets.json");
const publishPage = require("../../../../locators/publishWidgetspage.json");

describe("Test Create Api and Bind to Button widget", function () {
  let dataSet;
  before("Test_Add users api and execute api", () => {
    cy.addDsl(dsl);

    cy.fixture("example").then(function (data) {
      dataSet = data;
      cy.createAndFillApi(dataSet.userApi, "/users");
      cy.RunAPI();
    });
  });

  it("1. Selects set interval function, Fill setInterval action creator and test code generated ", () => {
    cy.SearchEntityandOpen("Button1");
    cy.get(widgetsPage.buttonOnClick).last().click({ force: true });
    cy.get(commonlocators.chooseAction)
      .children()
      .contains("Set interval")
      .click();

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

  it("2. Works in the published version", () => {
    cy.PublishtheApp();
    cy.wait(3000);
    cy.get("span:contains('Submit')").closest("div").click();
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

  it("3. Selects clear interval function, Fill clearInterval action creator and test code generated", () => {
    cy.SearchEntityandOpen("Button1");
    cy.get(widgetsPage.buttonOnClick).last().click({ force: true });
    cy.get(commonlocators.chooseAction)
      .children()
      .contains("Clear interval")
      .click();
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
