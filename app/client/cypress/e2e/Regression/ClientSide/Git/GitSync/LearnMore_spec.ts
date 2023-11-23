import gitSyncLocators from "../../../../../locators/gitSyncLocators";
import homePage from "../../../../../locators/HomePage";
import * as _ from "../../../../../support/Objects/ObjectsCore";

const httpsRepoURL = "https://github.com/test/test.git";
const invalidURL = "test";

let repoName: string;
let generatedKey;
let windowOpenSpy: any;
describe("Git sync modal: Learn more links", function () {
  it("1. validates repo URL", function () {
    // open gitSync modal
    cy.get(homePage.deployPopupOptionTrigger).click({ force: true });
    cy.get(homePage.connectToGitBtn).click({ force: true });

    cy.get(gitSyncLocators.gitRepoInput).type(`{selectAll}${httpsRepoURL}`);
    cy.contains(Cypress.env("MESSAGES").PASTE_SSH_URL_INFO());
    cy.get(gitSyncLocators.generateDeployKeyBtn).should("not.exist");

    cy.get(gitSyncLocators.gitRepoInput).type(`{selectAll}${invalidURL}`);
    cy.contains(Cypress.env("MESSAGES").PASTE_SSH_URL_INFO());
    cy.get(gitSyncLocators.generateDeployKeyBtn).should("not.exist");

    // generate key button should be disappeared if empty repo
    cy.get(gitSyncLocators.gitRepoInput).type(`{selectAll}${""}`);
    cy.get(gitSyncLocators.generateDeployKeyBtn).should("not.exist");

    cy.get(gitSyncLocators.gitRepoInput).type(
      `{selectAll}${_.dataManager.GITEA_API_URL_TED}/${repoName}.git`,
    );
    cy.contains(Cypress.env("MESSAGES").PASTE_SSH_URL_INFO()).should(
      "not.exist",
    );

    cy.get(gitSyncLocators.generateDeployKeyBtn).should("not.be.disabled");

    cy.intercept("POST", "/api/v1/applications/ssh-keypair/*").as(
      "generateKey",
    );

    // Stubbing window.open
    // cy.window().then((window) => {
    //   windowOpenSpy = cy.stub(window, "open").callsFake((url) => {
    //     expect(url.startsWith("https://docs.appsmith.com/")).to.be.true;
    //     windowOpenSpy.restore();
    //   });
    // });

    cy.window().then((window) => {
      windowOpenSpy = cy.stub(window, "open").callsFake((url) => {
        if (
          url.includes("/version-control-with-git/connecting-to-git-repository")
        ) {
          expect(url).to.contain(
            "/version-control-with-git/connecting-to-git-repository",
          );
        } else if (url.includes("overview/managing-deploy-keys")) {
          expect(url).to.contain("overview/managing-deploy-keys");
        }
        windowOpenSpy.restore();
      });
    });

    // Click the "Learn more" link
    cy.get(gitSyncLocators.learnMoreSshUrl).click();
    cy.get(gitSyncLocators.generateDeployKeyBtn).click();

    cy.wait("@generateKey").then((result: any) => {
      generatedKey = result.response.body.data.publicKey;
    });
    cy.xpath(gitSyncLocators.learnMoreDeployKey).click({ force: true });
  });
});
