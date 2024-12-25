/* eslint-disable cypress/no-unnecessary-waiting */
/* eslint-disable cypress/no-assigning-return-values */

import { AppSidebar } from "./Pages/EditorNavigation";

require("cy-verify-downloads").addCustomCommand();
require("cypress-file-upload");
import gitSyncLocators from "../locators/gitSyncLocators";
import homePage from "../locators/HomePage";
import { ObjectsRegistry } from "./Objects/Registry";
const gitSync = ObjectsRegistry.GitSync;
const agHelper = ObjectsRegistry.AggregateHelper;
const dataManager = ObjectsRegistry.DataManager;
const assertHelper = ObjectsRegistry.AssertHelper;

const commonLocators = require("../locators/commonlocators.json");

Cypress.Commands.add("latestDeployPreview", () => {
  cy.intercept("POST", "/api/v1/applications/publish/*").as("publishApp");
  // Wait before publish
  // eslint-disable-next-line cypress/no-unnecessary-waiting
  cy.wait(2000);
  agHelper.AssertAutoSave();

  // Stubbing window.open to open in the same tab
  cy.window().then((window) => {
    cy.stub(window, "open").callsFake((url) => {
      window.location.href = Cypress.config().baseUrl + url.substring(1);
      window.location.target = "_self";
    });
  });
  agHelper.GetNClick(gitSync.locators.quickActionsCommitBtn);
  cy.wait(2000); // wait for modal to load
  cy.xpath("//span[text()='Latest deployed preview']").click();
  cy.log("pagename: " + localStorage.getItem("PageName"));
  cy.wait(5000); //wait time for page to load!
});

Cypress.Commands.add("createGitBranch", (branch) => {
  agHelper.AssertElementVisibility(gitSync.locators.quickActionsPullBtn);
  cy.get(gitSyncLocators.branchButton).click({ force: true });
  agHelper.AssertElementVisibility(gitSyncLocators.branchSearchInput);
  agHelper.ClearNType(gitSyncLocators.branchSearchInput, `${branch}`);
  // increasing timeout to reduce flakyness
  cy.get(".ads-v2-spinner", {
    timeout: Cypress.config().pageLoadTimeout,
  }).should("exist");
  cy.get(".ads-v2-spinner", {
    timeout: Cypress.config().pageLoadTimeout,
  }).should("not.exist");
  assertHelper.AssertDocumentReady();
  AppSidebar.assertVisible(Cypress.config().pageLoadTimeout);
});

Cypress.Commands.add("switchGitBranch", (branch, expectError) => {
  agHelper.AssertElementVisibility(gitSync.locators.quickActionsPullBtn);
  cy.get(gitSyncLocators.branchButton).click({ force: true });
  agHelper.AssertElementVisibility(gitSyncLocators.branchSearchInput);
  agHelper.ClearNType(gitSyncLocators.branchSearchInput, `${branch}`);
  cy.get(gitSyncLocators.branchListItem).contains(branch).click();
  if (!expectError) {
    // increasing timeout to reduce flakyness
    cy.get(".ads-v2-spinner", {
      timeout: Cypress.config().pageLoadTimeout,
    }).should("exist");
    cy.get(".ads-v2-spinner", {
      timeout: Cypress.config().pageLoadTimeout,
    }).should("not.exist");
  }
  assertHelper.AssertDocumentReady();
  AppSidebar.assertVisible(Cypress.config().pageLoadTimeout);
});

Cypress.Commands.add("commitAndPush", (assertFailure) => {
  cy.get(homePage.publishButton).click();
  agHelper.AssertElementExist(gitSync.locators.quickActionsPullBtn);
  cy.get(gitSyncLocators.commitCommentInput).type("Initial Commit");
  cy.get(gitSyncLocators.commitButton).click();
  if (!assertFailure) {
    // check for commit success
    //adding timeout since commit is taking longer sometimes
    cy.wait("@commit", { timeout: 35000 }).should(
      "have.nested.property",
      "response.body.responseMeta.status",
      201,
    );
    cy.wait(3000);
  } else {
    cy.wait("@commit", { timeout: 35000 }).then((interception) => {
      const status = interception.response.body.responseMeta.status;
      expect(status).to.be.gte(400);
    });
  }

  cy.get(gitSyncLocators.closeGitSyncModal).click();
});

Cypress.Commands.add("merge", (destinationBranch) => {
  agHelper.AssertElementExist(gitSync.locators.quickActionsPullBtn);

  cy.intercept("GET", "/api/v1/git/status/app/*").as(`gitStatus`);

  cy.intercept("GET", "/api/v1/git/branch/app/*").as(`gitBranches`);

  cy.get(gitSyncLocators.bottomBarMergeButton).click({ force: true });
  //cy.wait(6000); // wait for git status call to finish
  /*cy.wait("@gitStatus").should(
    "have.nested.property",
    "response.body.responseMeta.status",
    200,
  ); */

  agHelper.AssertElementEnabledDisabled(
    gitSync.locators.opsMergeBranchSelect,
    0,
    false,
  );
  agHelper.WaitUntilEleDisappear(gitSync.locators.opsMergeLoader);
  cy.wait(["@gitBranches", "@gitStatus"]).then((interceptions) => {
    if (
      interceptions[0]?.response?.statusCode === 200 &&
      interceptions[1]?.response?.statusCode === 200
    ) {
      cy.get(gitSync.locators.opsMergeBranchSelect).click();
      cy.get(commonLocators.dropdownmenu).contains(destinationBranch).click();
      gitSync.AssertAbsenceOfCheckingMergeability();
      assertHelper.WaitForNetworkCall("mergeStatus");
      cy.get("@mergeStatus").should(
        "have.nested.property",
        "response.body.data.isMergeAble",
        true,
      );
      cy.wait(2000);
      cy.contains(Cypress.env("MESSAGES").NO_MERGE_CONFLICT());
      cy.get(gitSync.locators.opsMergeBtn).click();
      assertHelper.AssertNetworkStatus("mergeBranch", 200);
      agHelper.AssertContains(Cypress.env("MESSAGES").MERGED_SUCCESSFULLY());
    }
  });
});

Cypress.Commands.add(
  "importAppFromGit",
  (repo, assertConnectFailure, failureMessage) => {
    const testEmail = "test@test.com";
    const testUsername = "testusername";

    cy.intercept("GET", "api/v1/git/import/keys?keyType=ECDSA").as(
      `generateKey-${repo}`,
    );
    cy.get(gitSyncLocators.gitRepoInput).type(
      `${dataManager.GIT_CLONE_URL}/${repo}.git`,
    );
    cy.get(gitSyncLocators.generateDeployKeyBtn).click();
    cy.wait(`@generateKey-${repo}`).then((result) => {
      const key = result.response.body.data.publicKey.trimEnd();
      cy.request({
        method: "POST",
        url: `${dataManager.GIT_API_BASE}/api/v1/git/keys/${repo}`,
        body: {
          title: "key1",
          key,
          read_only: false,
        },
      });

      cy.get(gitSyncLocators.useGlobalGitConfig).click({ force: true });

      cy.get(gitSyncLocators.gitConfigNameInput).type(
        `{selectall}${testUsername}`,
      );
      cy.get(gitSyncLocators.gitConfigEmailInput).type(
        `{selectall}${testEmail}`,
      );
      // click on the connect button and verify
      cy.get(gitSyncLocators.connectSubmitBtn).click();

      if (!assertConnectFailure) {
        // check for connect success
        cy.wait("@importFromGit").should(
          "have.nested.property",
          "response.body.responseMeta.status",
          201,
        );
      } else {
        cy.wait("@importFromGit").then((interception) => {
          const status = interception.response.body.responseMeta.status;
          const message = interception.response.body.responseMeta.error.message;
          expect(status).to.be.gte(400);
          expect(message).to.contain(failureMessage);
        });
      }
    });
  },
);

Cypress.Commands.add("gitDiscardChanges", () => {
  cy.get(gitSyncLocators.bottomBarCommitButton).click();
  cy.get(gitSyncLocators.discardChanges).should("be.visible");
  cy.get(gitSyncLocators.discardChanges)
    .children()
    .should("have.text", "Discard & pull");
  cy.get(gitSyncLocators.discardChanges).click();
  cy.contains(Cypress.env("MESSAGES").DISCARD_CHANGES_WARNING());
  cy.get(gitSyncLocators.discardChanges)
    .children()
    .should("have.text", "Are you sure?");
  cy.get(gitSyncLocators.discardChanges).click();
  cy.contains(Cypress.env("MESSAGES").DISCARDING_AND_PULLING_CHANGES());
  cy.validateToastMessage("Discarded changes successfully.");
  cy.wait(2000);
  assertHelper.AssertContains(
    Cypress.env("MESSAGES").UNABLE_TO_IMPORT_APP(),
    "not.exist",
  );
});

Cypress.Commands.add(
  "regenerateSSHKey",
  (repo, generateKey = true, protocol = "ECDSA") => {
    let generatedKey;
    cy.get(gitSyncLocators.bottomBarCommitButton).click();
    cy.get("[data-testid=t--tab-GIT_CONNECTION]").click();
    cy.wait(2000);
    cy.get(gitSyncLocators.SSHKeycontextmenu).eq(2).click();
    if (protocol === "ECDSA") {
      cy.get(gitSyncLocators.regenerateSSHKeyECDSA).click();
    } else if (protocol === "RSA") {
      cy.get(gitSyncLocators.regenerateSSHKeyRSA).click();
    }
    cy.contains(Cypress.env("MESSAGES").REGENERATE_KEY_CONFIRM_MESSAGE());
    cy.xpath(gitSyncLocators.confirmButton).click();
    if (protocol === "ECDSA") {
      cy.intercept("POST", "/api/v1/applications/ssh-keypair/*").as(
        `generateKey-${repo}`,
      );
    } else if (protocol === "RSA") {
      cy.intercept("POST", "/api/v1/applications/ssh-keypair/*?keyType=RSA").as(
        `generateKey-${repo}-RSA`,
      );
    }

    if (generateKey) {
      if (protocol === "ECDSA") {
        cy.wait(`@generateKey-${repo}`).then((result) => {
          const key = result.response.body.data.publicKey.trimEnd();
          cy.request({
            method: "POST",
            url: `${dataManager.GIT_API_BASE}/api/v1/repos/Cypress/${repo}/keys`,
            body: {
              title: "key1",
              key,
              read_only: false,
            },
          });

          cy.get(gitSyncLocators.closeGitSyncModal);
        });
      } else if (protocol === "RSA") {
        // doesn't work with github
      }
    }
  },
);
