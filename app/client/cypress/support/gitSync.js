/* eslint-disable cypress/no-unnecessary-waiting */
/* eslint-disable cypress/no-assigning-return-values */

import { AppSidebar } from "./Pages/EditorNavigation";

require("cy-verify-downloads").addCustomCommand();
require("cypress-file-upload");
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
  cy.get(gitSync.locators.quickActionsBranchBtn).click({ force: true });
  agHelper.AssertElementVisibility(gitSync.locators.branchSearchInput);
  agHelper.ClearNType(gitSync.locators.branchSearchInput, `${branch}`);
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
  cy.get(gitSync.locators.quickActionsBranchBtn).click({ force: true });
  agHelper.AssertElementVisibility(gitSync.locators.branchSearchInput);
  agHelper.ClearNType(gitSync.locators.branchSearchInput, `${branch}`);
  cy.get(gitSync.locators.branchItem).contains(branch).click();
  assertHelper.AssertDocumentReady();
  AppSidebar.assertVisible(Cypress.config().pageLoadTimeout);
});

Cypress.Commands.add("commitAndPush", (assertFailure) => {
  cy.get(homePage.publishButton).click();
  agHelper.AssertElementExist(gitSync.locators.quickActionsPullBtn);
  cy.get(gitSync.locators.opsCommitInput).type("Initial Commit");
  cy.get(gitSync.locators.opsCommitBtn).click();
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

  gitSync.CloseOpsModal();
});

Cypress.Commands.add("merge", (destinationBranch) => {
  agHelper.AssertElementExist(gitSync.locators.quickActionsPullBtn);

  cy.intercept("GET", "/api/v1/git/status/app/*").as(`gitStatus`);

  cy.intercept("GET", "/api/v1/git/branch/app/*").as(`gitBranches`);

  cy.get(gitSync.locators.quickActionsMergeBtn).click({ force: true });
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

Cypress.Commands.add("gitDiscardChanges", () => {
  cy.get(gitSync.locators.quickActionsCommitBtn).click();
  cy.get(gitSync.locators.opsDiscardBtn).should("be.visible");
  cy.get(gitSync.locators.opsDiscardBtn)
    .children()
    .should("have.text", "Discard & pull");
  cy.get(gitSync.locators.opsDiscardBtn).click();
  cy.contains(Cypress.env("MESSAGES").DISCARD_CHANGES_WARNING());
  cy.get(gitSync.locators.opsDiscardBtn)
    .children()
    .should("have.text", "Are you sure?");
  cy.get(gitSync.locators.opsDiscardBtn).click();
  cy.contains(Cypress.env("MESSAGES").DISCARDING_AND_PULLING_CHANGES());
  cy.validateToastMessage("Discarded changes successfully.");
  cy.wait(2000);
  assertHelper.AssertContains(
    Cypress.env("MESSAGES").UNABLE_TO_IMPORT_APP(),
    "not.exist",
  );
});
