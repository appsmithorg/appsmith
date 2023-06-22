import * as _ from "../../../../support/Objects/ObjectsCore";
import { CURRENT_REPO, REPO } from "../../../../fixtures/REPO";

describe("Private embed in-app ramp", () => {
  function checkRampLink(section: string) {
    const escapedSection = section.replace(/[-/\\^$*+?.()|[\]{}]/g, "\\$&");
    const regexPattern = new RegExp(
      `https:\\/\\/www\\.appsmith\\.com\\/pricing\\?source=CE&instance=.+&feature=private_embeds&section=${escapedSection}`,
    );

    cy.get(_.inviteModal.locators._privateEmbedRampLink)
      .should("have.attr", "href")
      .then((href) => {
        expect(href).to.match(regexPattern);
      });
  }

  function checkAppSettingsRamp() {
    _.embedSettings.OpenEmbedSettings();
    if (CURRENT_REPO === REPO.CE) {
      _.agHelper.AssertElementExist(_.inviteModal.locators._upgradeContent);
      _.agHelper.AssertElementAbsence(
        _.inviteModal.locators._shareSettingsButton,
      );
      _.agHelper.GetNAssertElementText(
        _.inviteModal.locators._privateEmbedRampAppSettings,
        "To embed private Appsmith apps and seamlessly authenticate users through SSO",
        "contain.text",
      );
      checkRampLink("app_settings");
    } else if (CURRENT_REPO === REPO.EE) {
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
      _.inviteModal.SelectEmbedTab();
      _.agHelper.GetNAssertElementText(
        _.inviteModal.locators._privateEmbedRampAppSettings,
        "Embed private Appsmith apps and seamlessly authenticate users through SSO in our Business Edition",
        "contain.text",
      );
      checkRampLink("share_modal");
    } else if (CURRENT_REPO === REPO.EE) {
      _.agHelper.AssertElementAbsence(
        _.inviteModal.locators._privateEmbedRampAppSettings,
      );
    }
  }
  it("1. Ramp should be visibile to ADMIN and DEVELOPER", () => {
    checkAppSettingsRamp();
    checkShareModalRamp();
    _.agHelper.GetNClick(_.homePage._homeIcon, 0, true, 2000);
    _.agHelper.GenerateUUID();
    cy.get("@guid").then((uid) => {
      let workspaceName: any = uid;
      _.homePage.CreateNewWorkspace(workspaceName);
      _.homePage.InviteUserToWorkspace(
        workspaceName,
        Cypress.env("TESTUSERNAME1"),
        "Developer",
      );
      _.inviteModal.CloseModal();
      _.homePage.Signout(false);
      _.homePage.LogintoApp(
        Cypress.env("TESTUSERNAME1"),
        Cypress.env("TESTPASSWORD1"),
      );
      _.agHelper.GenerateUUID();
      cy.get("@guid").then((uid) => {
        let appName: any = uid;
        _.homePage.CreateAppInWorkspace(workspaceName, appName);
      });
      checkAppSettingsRamp();
      checkShareModalRamp();
    });
  });
});
