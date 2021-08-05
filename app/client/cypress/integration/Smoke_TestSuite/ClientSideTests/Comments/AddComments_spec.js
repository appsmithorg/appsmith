const commentsLocators = require("../../../../locators/commentsLocators.json");
const commonLocators = require("../../../../locators/commonlocators.json");
const homePage = require("../../../../locators/HomePage.json");
const dsl = require("../../../../fixtures/basicDsl.json");

function setFlagForTour() {
  return new Promise((resolve) => {
    const request = indexedDB.open("Appsmith", 2); // had to use version: 2 here, TODO: check why
    request.onerror = function(event) {
      console.log("Error loading database", event);
    };
    request.onsuccess = function(event) {
      const db = request.result;
      const transaction = db.transaction("keyvaluepairs", "readwrite");
      const objectStore = transaction.objectStore("keyvaluepairs");
      objectStore.put(true, "CommentsIntroSeen");
      resolve();
    };
  });
}

function typeIntoDraftEditor(selector, text) {
  cy.get(selector).then((input) => {
    var textarea = input.get(0);
    textarea.dispatchEvent(new Event("focus"));

    var textEvent = document.createEvent("TextEvent");
    textEvent.initTextEvent("textInput", true, true, null, text);
    textarea.dispatchEvent(textEvent);

    textarea.dispatchEvent(new Event("blur"));
  });
}

const newCommentText1 = "new comment text 1";
let commentThreadId;
let appName;

describe("Comments", function() {
  before(() => {
    return cy.wrap(null).then(async () => {
      cy.addDsl(dsl);
      appName = localStorage.getItem("AppName");
      await setFlagForTour();
    });
  });

  /**
   * create new comment thread
   * share app with an admin user
   *  - check if he can view the comments on edit mode
   *  - check the unread indicator shows due to unread comments
   * publish and check if the comment shows up on view mode
   */

  it("new comments can be created after switching to comment mode", () => {
    return cy.wrap(null).then(async () => {
      cy.get(commentsLocators.switchToCommentModeBtn).click({ force: true });
      cy.get(commonLocators.canvas).click(50, 50);
      typeIntoDraftEditor(commentsLocators.mentionsInput, newCommentText1);
      cy.get(commentsLocators.mentionsInput).type("{enter}");
      await cy.wait("@createNewThread");
    });
  });

  // create another comment since the first one is a private bot thread
  it("another comment can be created after dismissing the first one", () => {
    cy.get(commonLocators.canvas).click(10, 10);
    // wait for transition to be completed
    // eslint-disable-next-line cypress/no-unnecessary-waiting
    cy.wait(300);
    typeIntoDraftEditor(commentsLocators.mentionsInput, newCommentText1);
    cy.get(commentsLocators.mentionsInput).type("{enter}");
    cy.wait("@createNewThread").then((response) => {
      commentThreadId = response.response.body.data.id;
    });
  });

  it("unread indicator is visible for another app user when a new comment is added", () => {
    // share app with TESTUSERNAME2
    cy.get(homePage.shareApp).click({ force: true });
    cy.shareApp(Cypress.env("TESTUSERNAME2"), homePage.adminRole);
    cy.LogintoApp(Cypress.env("TESTUSERNAME2"), Cypress.env("TESTPASSWORD2"));

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
    cy.get(commentsLocators.switchToCommentModeBtn).click({
      force: true,
    });
    cy.get(
      `${commentsLocators.inlineCommentThreadPin}${commentThreadId}`,
    ).click({ force: true });
    cy.contains(newCommentText1);
  });
});
