import commentsLocators from "../../../../locators/CommentsLocators";
const commonLocators = require("../../../../locators/commonlocators.json");
import homePage from "../../../../locators/HomePage";
const dsl = require("../../../../fixtures/basicDsl.json");

const newCommentText1 = "new comment text 1";
let commentThreadId;
let appName;
let workspaceName;

describe("Comments", function() {
  before(() => {
    return cy.wrap(null).then(async () => {
      cy.NavigateToHome();

      cy.generateUUID().then((uid) => {
        appName = uid;
        workspaceName = uid;
        cy.createWorkspace();
        cy.wait("@createWorkspace").then((interception) => {
          const newWorkspaceName = interception.response.body.data.name;
          cy.renameWorkspace(newWorkspaceName, workspaceName);
        });
        cy.CreateAppForWorkspace(workspaceName, appName);
        cy.addDsl(dsl);
      });
    });
  });

  /**
   * create new comment thread
   * share app with an admin user
   *  - check if he can view the comments on edit mode
   *  - check the unread indicator shows due to unread comments
   * publish and check if the comment shows up on view mode
   */
  it("Skipping comments tour also skips bot comments", function() {
    cy.generateUUID().then((uid) => {
      cy.Signup(`${uid}@appsmithtest.com`, uid);
    });
    cy.wait(1000);
    cy.NavigateToHome();

    cy.generateUUID().then((uid) => {
      appName = uid;
      workspaceName = uid;
      cy.createWorkspace();
      cy.wait("@createWorkspace").then((interception) => {
        const newWorkspaceName = interception.response.body.data.name;
        cy.renameWorkspace(newWorkspaceName, workspaceName);
      });
      cy.CreateAppForWorkspace(workspaceName, appName);
      cy.addDsl(dsl);
    });
    cy.skipCommentsOnboarding();

    // wait for comment mode to be set
    cy.wait(1000);
    cy.get(commonLocators.canvas).click(50, 50);

    cy.typeIntoDraftEditor(commentsLocators.mentionsInput, newCommentText1);
    cy.get(commentsLocators.mentionsInput).type("{enter}");
    // when user adds first comment, following command will count for the headers of the comment card
    // in case of "Skip Tour" this has to be 2.
    cy.get("[data-cy=comments-card-header]")
      .its("length")
      .should("eq", 2);
  });

  it("Completing comments tour adds bot comment in first thread", function() {
    cy.generateUUID().then((uid) => {
      cy.Signup(`${uid}@appsmithtest.com`, uid);
    });
    cy.NavigateToHome();

    cy.generateUUID().then((uid) => {
      appName = uid;
      workspaceName = uid;
      cy.createWorkspace();
      cy.wait("@createWorkspace").then((interception) => {
        const newWorkspaceName = interception.response.body.data.name;
        cy.renameWorkspace(newWorkspaceName, workspaceName);
      });
      cy.CreateAppForWorkspace(workspaceName, appName);
      cy.addDsl(dsl);
    });
    cy.get(commonLocators.canvas);
    cy.get(commentsLocators.switchToCommentModeBtn).click({ force: true });
    cy.contains("NEXT").click({ force: true });
    cy.contains("NEXT").click({ force: true });
    cy.get("input[name='displayName']").type("Touring User");
    cy.get("button[type='submit']").click();

    // wait for comment mode to be set
    cy.wait(1000);
    cy.get(commentsLocators.switchToCommentModeBtn).click({ force: true });
    cy.get(commonLocators.canvas).click(50, 50);

    cy.typeIntoDraftEditor(commentsLocators.mentionsInput, newCommentText1);
    cy.get(commentsLocators.mentionsInput).type("{enter}");
    cy.get("[data-cy=comments-card-header]")
      .its("length")
      .should("eq", 3);
    cy.contains("Appsmith Bot").should("be.visible");
  });

  // create another comment since the first one is a private bot thread
  it("another comment can be created after dismissing the first one", () => {
    cy.get(commonLocators.canvas).click(60, 10);
    // wait for transition to be completed
    // eslint-disable-next-line cypress/no-unnecessary-waiting
    cy.wait(300);
    cy.typeIntoDraftEditor(commentsLocators.mentionsInput, newCommentText1);
    cy.get(commentsLocators.mentionsInput).type("{enter}");
    cy.wait("@createNewThread").then((response) => {
      commentThreadId = response.response.body.data.id;
    });
  });

  it("Can invite new collaborators, with substring emails", () => {
    cy.get(commentsLocators.cancelCommentButton).click({ force: true });
    cy.get(homePage.shareApp).click({ force: true });
    cy.shareApp("cypresstest@appsmith.com", homePage.viewerRole);
    cy.get(commonLocators.canvas).click(30, 30);
    cy.wait(300);
    cy.get(commentsLocators.mentionsInput).type("@test@appsmith.com", {
      delay: 100,
    });
    cy.wait(1000);
    cy.contains("Invite a new user").should("exist");
  });

  it("unread indicator is visible for another app user when a new comment is added", () => {
    // share app with TESTUSERNAME2
    cy.get(homePage.shareApp).click({ force: true });
    cy.shareApp(Cypress.env("TESTUSERNAME1"), homePage.adminRole);
    cy.LogintoApp(Cypress.env("TESTUSERNAME1"), Cypress.env("TESTPASSWORD1"));

    // launch the editor
    cy.get(homePage.searchInput).type(appName);
    // eslint-disable-next-line cypress/no-unnecessary-waiting
    cy.wait(2000);
    cy.get(homePage.applicationCard)
      .first()
      .trigger("mouseover");
    cy.get(homePage.appEditIcon)
      .first()
      .click({ force: true });
    cy.get("#loading").should("not.exist");

    // unread indicator should be visible since a new comment was added
    cy.get(commentsLocators.toggleCommentModeOnUnread).should("exist");
    cy.get(commentsLocators.toggleCommentModeOn).should("not.exist");
  });

  it("is visible for the other app users in edit mode", () => {
    cy.get(commentsLocators.switchToCommentModeBtn).click({
      force: true,
    });
    // this is needed, as on CI we create new users
    cy.contains("SKIP").click({ force: true });
    cy.get("input[name='displayName']").type("Skip User");
    cy.get("button[type='submit']").click();
    cy.get(
      `${commentsLocators.inlineCommentThreadPin}${commentThreadId}`,
    ).click({ force: true });
    cy.contains(newCommentText1);
  });

  it("unread indicator should be hidden once all comment threads are marked as read", () => {
    // thread should be marked as read by clicking before, unread indicator should not be visible
    cy.get(commentsLocators.toggleCommentModeOnUnread).should("not.exist");
    cy.get(commentsLocators.toggleCommentModeOn).should("exist");
  });

  it("is visible in the published mode", () => {
    cy.PublishtheApp();
    // wait for the published page to load
    cy.get(commonLocators.viewerPage);
    cy.get(commentsLocators.switchToCommentModeBtn).click({
      force: true,
    });
    cy.get(
      `${commentsLocators.inlineCommentThreadPin}${commentThreadId}`,
    ).click({ force: true });
    cy.contains(newCommentText1);
  });
});
