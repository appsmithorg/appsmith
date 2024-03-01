import { featureFlagIntercept } from "../../../../support/Objects/FeatureFlags";
import { agHelper } from "../../../../support/Objects/ObjectsCore";
import { gitExtended } from "../../../../support/ee/ObjectsCore_EE";

let wsName: string;
let appName: string;
let appId: string;
let repoName: string;

describe(
  "Test cases for existing git continuous delivery configuration",
  { tags: ["@tag.Git"] },
  function () {
    before(() => {
      featureFlagIntercept({
        release_git_continuous_delivery_enabled: true,
        license_git_continuous_delivery_enabled: true,
      });
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
      gitExtended.ConfigureCD();
    });

    beforeEach(() => {
      featureFlagIntercept({
        release_git_continuous_delivery_enabled: true,
        license_git_continuous_delivery_enabled: true,
      });
    });

    it("1. Validates UI elements for existing continuous delivery configuration", function () {
      gitExtended.OpenGitSettingsModal("CD");
      agHelper.AssertElementExist(gitExtended._cdExisting);
      agHelper.AssertElementExist(gitExtended._cdDisableBtn);
      agHelper.AssertElementExist(gitExtended._cdGenerateApiKeyBtn);
      agHelper.AssertElementExist(gitExtended._cdSetupBranchSelect);
      agHelper.AssertElementExist(gitExtended._cdCurlDisplay);
      agHelper.AssertElementExist(gitExtended._cdCurlCopyBtn);
      gitExtended.CloseGitSettingsModal();
    });

    it("2. Validates reconfiguring api key", function () {
      const regenerateCDApiKeyAlias = `generateCDApiKey-${repoName}`;
      cy.intercept("POST", "/api/v1/api-key/git/*").as(regenerateCDApiKeyAlias);
      gitExtended.OpenGitSettingsModal("CD");
      agHelper.AssertElementExist(gitExtended._cdExisting);
      agHelper.GetNClick(gitExtended._cdGenerateApiKeyBtn);
      agHelper.AssertElementVisibility(
        gitExtended._cdReconfigureKeyModal,
        true,
      );
      agHelper.AssertElementAbsence(gitExtended._gitSettingsModal);
      agHelper.GetNClick(gitExtended._cdReconfigureKeyBtn);
      let apiKey = "";
      cy.wait(`@${regenerateCDApiKeyAlias}`).then((interception) => {
        apiKey = interception?.response?.body?.data;
        expect(interception?.response?.statusCode).to.equal(201);
        expect(interception?.response?.body?.data).to.be.a("string");
      });
      agHelper.AssertElementAbsence(gitExtended._cdReconfigureKeyModal);
      agHelper.AssertElementVisibility(gitExtended._gitSettingsModal, true);
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
      gitExtended.CloseGitSettingsModal();
    });

    it("3. Validates cURL and checks if cURL changes when branch is changed", function () {
      gitExtended.GetCurrentBranchName().then((dBranch) => {
        let defaultBranch = dBranch?.toString() || "";
        defaultBranch = defaultBranch.replace("*", "");
        gitExtended.CreateGitBranch("branch-1", true);
        cy.get("@gitbranchName").then((tBranch) => {
          const tempBranch = tBranch.toString();
          gitExtended.SwitchGitBranch(defaultBranch);
          gitExtended.OpenGitSettingsModal("CD");
          agHelper.AssertElementExist(gitExtended._cdExisting);
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

    it("4. Validates disabling continuous delivery", function () {
      const disableCDAlias = `disableCD-${repoName}`;
      cy.intercept("PATCH", "/api/v1/git/auto-deployment/toggle/app/*").as(
        disableCDAlias,
      );
      gitExtended.OpenGitSettingsModal("CD");
      agHelper.GetNClick(gitExtended._cdDisableBtn);
      agHelper.AssertElementVisibility(gitExtended._cdDisableModal, true);
      agHelper.GetNClick(gitExtended._cdDisableConfirmCheckbox, 0, true);
      agHelper.GetNClick(gitExtended._cdDisableConfirmBtn);
      cy.wait(`@${disableCDAlias}`).then((interception) => {
        expect(interception?.response?.statusCode).to.equal(200);
      });
      agHelper.ValidateToastMessage(
        "Continuous delivery disabled successfully.",
      );
    });

    after(() => {
      gitExtended.DeleteTestGithubRepo(repoName);
    });
  },
);
