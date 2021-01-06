const onboarding = require("../../../locators/Onboarding.json");
const explorer = require("../../../locators/explorerlocators.json");
const homePage = require("../../../locators/HomePage.json");
const loginPage = require("../../../locators/LoginPage.json");

describe("Onboarding", function() {
  it("Onboarding flow", function() {
    cy.LogOut();

    cy.visit("/user/signup");
    cy.get("input[name='email']").type(Cypress.env("USERNAME"));
    cy.get(loginPage.password).type(Cypress.env("PASSWORD"));
    cy.get(loginPage.submitBtn).click();

    cy.LogintoApp(Cypress.env("USERNAME"), Cypress.env("PASSWORD"));

    cy.get(homePage.createNew)
      .first()
      .click({ force: true });
    cy.wait("@createNewApplication").should(
      "have.nested.property",
      "response.body.responseMeta.status",
      201,
    );
    cy.get("#loading").should("not.exist");

    //Onboarding
    cy.contains(".t--create-database", "Explore Appsmith").click();

    // Create and run query
    cy.get(".t--onboarding-indicator").should("be.visible");
    cy.get(".t--create-query").click();
    cy.runQuery();

    // Add widget
    cy.get(".t--add-widget").click();
    cy.dragAndDropToCanvas("tablewidget", { x: 30, y: -30 });

    cy.get(onboarding.tooltipSnippet).click({ force: true });

    cy.get(".t--property-control-tabledata" + " .CodeMirror textarea")
      .first()
      .focus({ force: true })
      .type("{uparrow}", { force: true })
      .type("{ctrl}{shift}{downarrow}", { force: true });
    cy.focused().then(() => {
      cy.get(".t--property-control-tabledata" + " .CodeMirror")
        .first()
        .then((editor) => {
          editor[0].CodeMirror.setValue("{{ExampleQuery.data}}");
        });
    });
    cy.closePropertyPane();
    cy.get(explorer.closeWidgets).click();

    cy.openPropertyPane("tablewidget");
    cy.closePropertyPane();

    cy.get(".t--application-feedback-btn").should("not.be.visible");

    // Publish
    cy.window().then((window) => {
      cy.stub(window, "open").callsFake((url) => {
        window.location.href = Cypress.config().baseUrl + url.substring(1);
        window.location.target = "_self";
      });
    });
    cy.get(homePage.publishButton).click();
    cy.wait("@publishApp");

    cy.get(".t--continue-on-my-own").click();
  });
});
