import * as _ from "../../../../support/Objects/ObjectsCore";
import { CURRENT_REPO, REPO } from "../../../../fixtures/REPO";
import { featureFlagIntercept } from "../../../../support/Objects/FeatureFlags";

describe("Private embed in-app ramp", { tags: ["@tag.Settings"] }, () => {
  function checkRampTextInAppSettings() {
    _.agHelper.AssertElementExist(_.inviteModal.locators._upgradeContent);
    _.agHelper.AssertElementAbsence(
      _.inviteModal.locators._shareSettingsButton,
    );
    _.agHelper.GetNAssertElementText(
      _.inviteModal.locators._privateEmbedRampAppSettings,
      Cypress.env("MESSAGES").IN_APP_EMBED_SETTING.rampSubtextSidebar(),
      "contain.text",
    );
    checkRampLink();
  }
  function checkRampTextInShareModal() {
    _.inviteModal.SelectEmbedTab();
    _.agHelper.GetNAssertElementText(
      _.inviteModal.locators._privateEmbedRampAppSettings,
      Cypress.env("MESSAGES").IN_APP_EMBED_SETTING.rampSubtextModal(),
      "contain.text",
    );
    checkRampLink();
  }
  function checkRampLink() {
    cy.get(_.inviteModal.locators._privateEmbedRampLink)
      .should("have.attr", "href")
      .then((href) => {
        expect(href).to.include("https://www.appsmith.com/pricing?");
      });
  }

  function checkAppSettingsRamp() {
    _.embedSettings.OpenEmbedSettings();
    if (CURRENT_REPO === REPO.CE) {
      checkRampTextInAppSettings();
    } else if (CURRENT_REPO === REPO.EE) {
      featureFlagIntercept({
        license_private_embeds_enabled: false,
      });
      _.embedSettings.OpenEmbedSettings();
      checkRampTextInAppSettings();
      featureFlagIntercept({
        license_private_embeds_enabled: true,
      });
      _.embedSettings.OpenEmbedSettings();
      _.agHelper.AssertElementAbsence(_.inviteModal.locators._upgradeContent);
      _.agHelper.AssertElementAbsence(
        _.inviteModal.locators._privateEmbedRampAppSettings,
      );
    }
    _.appSettings.ClosePane();
  }

  function checkShareModalRamp() {
    _.inviteModal.OpenShareModal();
    if (CURRENT_REPO === REPO.CE) {
      checkRampTextInShareModal();
    } else if (CURRENT_REPO === REPO.EE) {
      featureFlagIntercept({
        license_private_embeds_enabled: false,
      });
      _.agHelper.WaitUntilEleAppear("[data-testid=t--canvas-artboard]");
      _.inviteModal.OpenShareModal();
      checkRampTextInShareModal();
      featureFlagIntercept({
        license_private_embeds_enabled: true,
      });
      _.agHelper.WaitUntilEleAppear("[data-testid=t--canvas-artboard]");
      _.inviteModal.OpenShareModal();
      _.agHelper.AssertElementAbsence(
        _.inviteModal.locators._privateEmbedRampAppSettings,
      );
    }
  }
  it("1. Ramp should be visibile to ADMIN and DEVELOPER", () => {
    featureFlagIntercept({ license_gac_enabled: true });
    cy.wait(2000);

    checkAppSettingsRamp();
    checkShareModalRamp();
    _.agHelper.GetNClick(_.homePage._homeIcon, 0, true, 2000);
    _.agHelper.GenerateUUID();
    cy.get("@guid").then((uid) => {
      featureFlagIntercept({ license_gac_enabled: true });
      cy.wait(2000);
      let workspaceName: any = uid;
      _.homePage.CreateNewWorkspace(workspaceName);
      _.homePage.InviteUserToWorkspace(
        workspaceName,
        Cypress.env("TESTUSERNAME1"),
        "Developer",
      );
      _.inviteModal.CloseModal();
      _.homePage.Signout(false);
      cy.LoginFromAPI(
        Cypress.env("TESTUSERNAME1"),
        Cypress.env("TESTPASSWORD1"),
      );
      _.agHelper.GenerateUUID();
      cy.get("@guid").then((uid) => {
        let appName: any = uid;
        _.homePage.SelectWorkspace(workspaceName);
        _.homePage.CreateAppInWorkspace(workspaceName, appName);
      });
      checkAppSettingsRamp();
      checkShareModalRamp();
    });
  });
});
