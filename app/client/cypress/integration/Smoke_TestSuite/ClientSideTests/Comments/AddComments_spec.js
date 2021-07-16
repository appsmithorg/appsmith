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

describe("Comments", function() {
  before(() => {
    cy.addDsl(dsl);
  });

  /**
   * create new comment thread
   * share app with an admin user -> check if he can view the comments on edit mode
   * publish and check if the comment shows up on view mode
   */
  it("Comment visible to all users on viewer and editor", () => {
    cy.wrap(null).then(() => {
      return setFlagForTour().then(() => {
        const appname = localStorage.getItem("AppName");

        cy.get(commentsLocators.switchToCommentModeBtn).click({ force: true });

        cy.get(commonLocators.canvas).click(50, 50);
        typeIntoDraftEditor(commentsLocators.mentionsInput, newCommentText1);
        cy.get(commentsLocators.mentionsInput).type("{enter}");

        cy.wait("@createNewThread").then((response) => {
          commentThreadId = response.response.body.data.id;

          cy.get(homePage.shareApp).click({ force: true });
          cy.shareApp(Cypress.env("TESTUSERNAME1"), homePage.adminRole);

          cy.LogintoApp(
            Cypress.env("TESTUSERNAME1"),
            Cypress.env("TESTPASSWORD1"),
          );

          cy.get(homePage.searchInput).type(appname);
          // eslint-disable-next-line cypress/no-unnecessary-waiting
          cy.wait(2000);
          cy.get(homePage.applicationCard)
            .first()
            .trigger("mouseover");
          cy.get(homePage.appEditIcon)
            .first()
            .click({ force: true });
          cy.get("#loading").should("not.exist");

          cy.get(commentsLocators.switchToCommentModeBtn).click({
            force: true,
          });
          cy.get(
            `${commentsLocators.inlineCommentThreadPin}${commentThreadId}`,
          ).click({ force: true });
          cy.contains(newCommentText1);

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
    });
  });
});
