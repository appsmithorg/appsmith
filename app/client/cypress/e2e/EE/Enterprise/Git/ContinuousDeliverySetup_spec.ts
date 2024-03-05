import { featureFlagIntercept } from "../../../../support/Objects/FeatureFlags";
import { agHelper } from "../../../../support/Objects/ObjectsCore";
import { gitExtended } from "../../../../support/ee/ObjectsCore_EE";

let wsName: string;
let appName: string;
let appId: string;
let repoName: string;

describe(
  "Test cases for git continuous delivery feature",
  { tags: ["@tag.Git"] },
  function () {
    before(() => {
      cy.get("@workspaceName")
        .then((workspaceName) => {
          wsName = workspaceName.toString();
          return cy.get("@appName");
        })
        .then((applicationName) => {
          appName = applicationName.toString();
          return cy.get("@applicationId");
        })
        .then((applicationId) => {
          appId = applicationId.toString();
        });
      gitExtended.CreateNConnectToGit();
      cy.get("@gitRepoName").then((repName) => {
        repoName = repName.toString();
      });
    });

    it("1. Validates UI elements for continuous delivery setup", function () {
      featureFlagIntercept({
        release_git_continuous_delivery_enabled: true,
        license_git_continuous_delivery_enabled: true,
      });
      gitExtended.OpenGitSettingsModal("CD");
      agHelper.AssertElementExist(gitExtended._cdSetup);
      agHelper.AssertElementExist(gitExtended._cdSetupBranchSelect);
      agHelper.AssertElementExist(gitExtended._cdCurlDisplay);
      agHelper.AssertElementExist(gitExtended._cdCurlCopyBtn);
      agHelper.AssertElementExist(gitExtended._cdGenerateApiKeyBtn);
      agHelper.AssertElementExist(gitExtended._cdConfirmSetupCheckbox);
      agHelper.AssertElementExist(gitExtended._cdFinishSetupBtn);
      agHelper.AssertElementEnabledDisabled(
        gitExtended._cdConfirmSetupCheckbox,
        0,
        true,
      );
      agHelper.AssertElementEnabledDisabled(
        gitExtended._cdFinishSetupBtn,
        0,
        true,
      );
      gitExtended.CloseGitSettingsModal();
    });

    it("2. Validates cURL for continuous delivery setup", function () {
      featureFlagIntercept({
        release_git_continuous_delivery_enabled: true,
        license_git_continuous_delivery_enabled: true,
      });
      gitExtended.OpenGitSettingsModal("CD");
      cy.location("origin").then((origin) => {
        agHelper
          .GetText(gitExtended._cdSetupBranchSelect, "text", 0)
          .then((branch) => {
            agHelper.GetNAssertContains(
              gitExtended._cdCurlDisplay,
              `curl --location --request POST ${origin}/api/v1/git/deploy/app/${appId}?branchName=${branch} --header 'Authorization: Bearer <bearer token>'`,
            );
          });
      });
      gitExtended.CloseGitSettingsModal();
    });

    it("3. Validates changing branch name changes cURL", function () {
      featureFlagIntercept({
        release_git_continuous_delivery_enabled: true,
        license_git_continuous_delivery_enabled: true,
      });
      gitExtended.GetCurrentBranchName().then((dBranch) => {
        let defaultBranch = dBranch?.toString() || "";
        defaultBranch = defaultBranch.replace("*", "");
        gitExtended.CreateGitBranch("branch-1", true);
        cy.get("@gitbranchName").then((tBranch) => {
          const tempBranch = tBranch.toString();
          gitExtended.SwitchGitBranch(defaultBranch);
          gitExtended.OpenGitSettingsModal("CD");
          agHelper.GetNAssertContains(
            gitExtended._cdCurlDisplay,
            `curl --location --request POST ${origin}/api/v1/git/deploy/app/${appId}?branchName=${defaultBranch} --header 'Authorization: Bearer <bearer token>'`,
          );
          gitExtended.SelectOptionFromCDBranchDropdown(tempBranch);
          agHelper.GetNAssertContains(
            gitExtended._cdCurlDisplay,
            `curl --location --request POST ${origin}/api/v1/git/deploy/app/${appId}?branchName=${tempBranch} --header 'Authorization: Bearer <bearer token>'`,
          );
          gitExtended.SelectOptionFromCDBranchDropdown(defaultBranch);
          agHelper.GetNAssertContains(
            gitExtended._cdCurlDisplay,
            `curl --location --request POST ${origin}/api/v1/git/deploy/app/${appId}?branchName=${defaultBranch} --header 'Authorization: Bearer <bearer token>'`,
          );
          gitExtended.CloseGitSettingsModal();
        });
      });
    });

    it("4. Validates clicking generate bearer token creates a bearer token", function () {
      featureFlagIntercept({
        release_git_continuous_delivery_enabled: true,
        license_git_continuous_delivery_enabled: true,
      });
      const generateCDApiKeyAlias = `generateCDApiKey-${repoName}`;
      cy.intercept("POST", "/api/v1/api-key/git/*").as(generateCDApiKeyAlias);
      gitExtended.OpenGitSettingsModal("CD");
      agHelper.GetNClick(gitExtended._cdGenerateApiKeyBtn);
      cy.wait(`@${generateCDApiKeyAlias}`).then((interception) => {
        const apiKey = interception?.response?.body?.data;
        expect(interception?.response?.statusCode).to.equal(201);
        expect(apiKey).to.be.a("string");
        agHelper.AssertElementExist(gitExtended._cdApiKeyDisplay);
        agHelper.AssertElementExist(gitExtended._cdApiKeyCopyBtn);
        agHelper
          .GetText(gitExtended._cdApiKeyDisplay, "text", 0)
          .then((dApiKey) => {
            const displayedApiKey = dApiKey?.toString() || "";
            expect(displayedApiKey.toString().substring(0, 4)).to.equal(
              apiKey.substring(0, 4),
            );
          });
      });
      gitExtended.CloseGitSettingsModal();
    });

    it("5. Validates clicking on finish setup completes the configuration process", function () {
      featureFlagIntercept({
        release_git_continuous_delivery_enabled: true,
        license_git_continuous_delivery_enabled: true,
      });
      const generateCDApiKeyAlias = `generateCDApiKey-${repoName}`;
      const finishSetupAlias = `finishCDSetup-${repoName}`;
      cy.intercept("POST", "/api/v1/api-key/git/*").as(generateCDApiKeyAlias);
      cy.intercept("PATCH", "/api/v1/git/auto-deployment/toggle/app/*").as(
        finishSetupAlias,
      );
      gitExtended.OpenGitSettingsModal("CD");
      agHelper.GetNClick(gitExtended._cdGenerateApiKeyBtn);
      cy.wait(`@${generateCDApiKeyAlias}`).then((interception) => {
        expect(interception?.response?.statusCode).to.equal(201);
      });
      agHelper.AssertElementEnabledDisabled(
        gitExtended._cdConfirmSetupCheckbox,
        0,
        false,
      );
      agHelper.AssertElementEnabledDisabled(
        gitExtended._cdFinishSetupBtn,
        0,
        true,
      );
      agHelper.GetNClick(gitExtended._cdConfirmSetupCheckbox, 0, true);
      agHelper.AssertElementEnabledDisabled(
        gitExtended._cdFinishSetupBtn,
        0,
        false,
      );
      agHelper.GetNClick(gitExtended._cdFinishSetupBtn);
      cy.wait(`@${finishSetupAlias}`).then((interception) => {
        expect(interception?.response?.statusCode).to.equal(200);
      });
      agHelper.AssertElementExist(gitExtended._cdExisting);
      gitExtended.CloseGitSettingsModal();
    });

    after(() => {
      gitExtended.DeleteTestGithubRepo(repoName);
    });
  },
);
