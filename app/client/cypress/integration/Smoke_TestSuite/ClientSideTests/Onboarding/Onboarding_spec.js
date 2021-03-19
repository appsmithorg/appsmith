const explorer = require("../../../../locators/explorerlocators.json");
const homePage = require("../../../../locators/HomePage.json");
const commonlocators = require("../../../../locators/commonlocators.json");

describe("Onboarding", function() {
  it("Onboarding flow", function() {
    cy.get(commonlocators.homeIcon).click({ force: true });

    cy.get(".t--welcome-tour").click();
    cy.get(".t--onboarding-action").click();

    cy.wait("@createNewApplication").should(
      "have.nested.property",
      "response.body.responseMeta.status",
      201,
    );

    // eslint-disable-next-line cypress/no-unnecessary-waiting
    cy.wait(5000);
    cy.get(".bp3-spinner-head").should("not.exist");
    cy.get(".t--start-building")
      .should("be.visible")
      .click({ force: true });

    // Create and run query
    cy.get(".t--onboarding-indicator").should("be.visible");
    cy.get(".t--create-query").click();
    cy.runQuery();

    // Add widget
    cy.get(".t--add-widget").click();
    cy.dragAndDropToCanvas("tablewidget", { x: 30, y: -30 });

    // Click on "Show me how" and then copy hint
    cy.get(".t--onboarding-action").click();
    cy.get(".t--onboarding-snippet").click({ force: true });

    cy.get(".t--property-control-tabledata" + " .CodeMirror textarea")
      .first()
      .focus({ force: true })
      .type("{uparrow}", { force: true })
      .type("{ctrl}{shift}{downarrow}", { force: true });
    cy.focused().then(() => {
      cy.get(".t--property-control-tabledata" + " .CodeMirror")
        .first()
        .then((editor) => {
          editor[0].CodeMirror.setValue("{{fetch_standup_updates.data}}");
        });
    });
    cy.closePropertyPane();
    cy.get(explorer.closeWidgets).click();

    cy.openPropertyPane("tablewidget");
    cy.closePropertyPane();
    cy.get(".t--application-feedback-btn").should("not.exist");

    cy.contains(".t--onboarding-helper-title", "Capture Hero Updates");
    cy.get(".t--onboarding-cheat-action").click();
    cy.contains(".t--onboarding-helper-title", "Deploy the Standup Dashboard");
  });

  // Similar to PublishtheApp command with little changes
  it("Publish app", function() {
    cy.server();
    cy.route("POST", "/api/v1/applications/publish/*").as("publishApp");

    // Wait before publish
    // eslint-disable-next-line cypress/no-unnecessary-waiting
    cy.wait(2000);

    cy.window().then((window) => {
      cy.stub(window, "open").callsFake((url) => {
        window.location.href = Cypress.config().baseUrl + url.substring(1);
        window.location.target = "_self";
      });
    });
    cy.get(homePage.publishButton).click();
    cy.wait("@publishApp");

    cy.url().should("include", "/pages");
    cy.log("pagename: " + localStorage.getItem("PageName"));

    cy.get(".t--onboarding-secondary-action").click();
  });
});
