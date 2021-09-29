const commentsLocators = require("../../../../locators/commentsLocators.json");
const commonLocators = require("../../../../locators/commonlocators.json");
const widgetsPage = require("../../../../locators/Widgets.json");
const { typeIntoDraftEditor } = require("./utils");
const newCommentText1 = "new comment text 1";
describe("Comments", function() {
  it("Skipping comments tour also skips bot comments", function() {
    cy.generateUUID().then((uid) => {
      cy.Signup(`${uid}@appsmithtest.com`, uid);
    });
    cy.wait(1000);
    cy.get(".t--how-appsmith-works-modal-header", { timeout: 10000 }).should(
      "be.visible",
    );
    cy.get(".t--how-appsmith-works-modal-close").click({ force: true });
    cy.get("[data-testid=onboarding-tasks-datasource-alt]").click({
      force: true,
    });
    cy.get(widgetsPage.closeWidgetBar).click({ force: true });
    // wait for the page to load
    cy.get(commonLocators.canvas);
    cy.get(commentsLocators.switchToCommentModeBtn).click({ force: true });
    cy.contains("SKIP").click({ force: true });
    cy.get("input[name='displayName']").type("Skip User");
    cy.get("button[type='submit']").click();

    // wait for comment mode to be set
    cy.wait(1000);
    cy.get(commonLocators.canvas).click(50, 50);

    typeIntoDraftEditor(commentsLocators.mentionsInput, newCommentText1);
    cy.get(commentsLocators.mentionsInput).type("{enter}");
    // when user adds first comment, following command will count for the headers of the comment card
    // in case of "Skip Tour" this has to be 2.
    cy.get("[data-cy=comments-card-header]")
      .its("length")
      .should("eq", 2);
    cy.contains("Appsmith Bot").should("not.be.visible");
  });
  it("Completing comments tour adds bot comment in first thread", function() {
    cy.generateUUID().then((uid) => {
      cy.Signup(`${uid}@appsmithtest.com`, uid);
    });
    cy.get(".t--how-appsmith-works-modal-header", { timeout: 10000 }).should(
      "be.visible",
    );
    cy.get(".t--how-appsmith-works-modal-close").click({ force: true });
    cy.get("[data-testid=onboarding-tasks-datasource-alt]").click({
      force: true,
    });
    cy.get(widgetsPage.closeWidgetBar).click({ force: true });
    // wait for the page to load
    cy.get(commonLocators.canvas);
    cy.get(commentsLocators.switchToCommentModeBtn).click({ force: true });
    cy.contains("NEXT").click({ force: true });
    cy.contains("NEXT").click({ force: true });
    cy.get("input[name='displayName']").type("Touring User");
    cy.get("button[type='submit']").click();

    // wait for comment mode to be set
    cy.wait(1000);
    cy.get(commonLocators.canvas).click(50, 50);

    typeIntoDraftEditor(commentsLocators.mentionsInput, newCommentText1);
    cy.get(commentsLocators.mentionsInput).type("{enter}");
    cy.get("[data-cy=comments-card-header]")
      .its("length")
      .should("eq", 3);
    cy.contains("Appsmith Bot").should("be.visible");
  });
});
