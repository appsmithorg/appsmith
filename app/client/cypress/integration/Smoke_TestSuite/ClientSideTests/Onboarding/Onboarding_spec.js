/* eslint-disable cypress/no-unnecessary-waiting */
// const explorer = require("../../../../locators/explorerlocators.json");
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

    cy.window()
      .its("store")
      .invoke("getState")
      .then((state) => {
        const datasources = state.entities.datasources.list;
        const onboardingDatasource = datasources.find((datasource) => {
          const name = datasource.name;
          return name === "Super Updates DB";
        });

        if (!onboardingDatasource) {
          cy.wait("@createDatasource").then((httpRequest) => {
            const createdDbName = httpRequest.response.body.data.name;
            expect(createdDbName).to.be.equal("Super Updates DB");
          });
        }

        cy.get(".bp3-spinner-head").should("not.exist");
        cy.get(".t--start-building")
          .should("be.visible")
          .click({ force: true });

        cy.get(".t--create-query").click();
        cy.wait("@createNewApi");

        // Create and run query
        // Using the cheat option to create the action with 30 sec timeout
        cy.get(".t--onboarding-cheat-action")
          .should("be.visible")
          .click();

        cy.wait("@postExecute").then((httpRequest) => {
          expect(httpRequest.response.body.data.isExecutionSuccess).to.be.true;
        });

        // Add widget
        cy.get(".t--add-widget").click();
        cy.dragAndDropToCanvas("tablewidget", { x: 360, y: 40 });

        // wait for animation duration
        // eslint-disable-next-line cypress/no-unnecessary-waiting
        cy.wait(1000);
        // Click on "Show me how" and then click on cheat button
        cy.get(".t--onboarding-action")
          .should("be.visible")
          .click({ force: true });
        cy.get(".t--onboarding-cheat-action")
          .should("be.visible")
          .click();

        // wait for animation duration
        // eslint-disable-next-line cypress/no-unnecessary-waiting
        cy.wait(1000);
        cy.contains(".t--onboarding-helper-title", "Capture Hero Updates");
        cy.get(".t--onboarding-cheat-action").click();

        cy.contains(
          ".t--onboarding-helper-title",
          "Deploy the Standup Dashboard",
        );
      });
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
