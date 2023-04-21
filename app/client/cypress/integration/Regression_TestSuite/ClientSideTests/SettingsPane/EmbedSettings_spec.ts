import { CURRENT_REPO, REPO } from "../../../../fixtures/REPO";
import * as _ from "../../../../support/Objects/ObjectsCore";

describe("In-app embed settings", () => {
  function ValidateSyncWithInviteModal(showNavigationBar: "true" | "false") {
    _.embedSettings.OpenEmbedSettings();
    _.embedSettings.ToggleShowNavigationBar("true");
    _.inviteModal.OpenShareModal();
    _.inviteModal.SelectEmbedTab();
    const assertion =
      showNavigationBar === "true" ? "be.checked" : "not.be.checked";
    _.agHelper
      .GetElement(_.embedSettings.locators._showNavigationBar)
      .should(assertion);
    _.inviteModal.CloseModal();
  }

  it("1. Embed settings on App settings should show upgrade content if application is not public", () => {
    if (CURRENT_REPO === REPO.CE) {
      _.embedSettings.OpenEmbedSettings();
      _.agHelper.AssertElementExist(_.inviteModal.locators._upgradeContent);
      _.agHelper.AssertElementAbsence(
        _.inviteModal.locators._shareSettingsButton,
      );
      _.agHelper.AssertElementExist(_.inviteModal.locators._upgradeButton);
      cy.get(_.inviteModal.locators._upgradeButton).should(
        "have.attr",
        "href",
        "https://customer.appsmith.com/plans",
      );
      _.appSettings.ClosePane();
    }
  });

  it("2. Embed settings on Share modal should show upgrade content if application is not public", () => {
    if (CURRENT_REPO === REPO.CE) {
      _.inviteModal.OpenShareModal();
      _.inviteModal.SelectEmbedTab();
      _.agHelper.AssertElementExist(_.inviteModal.locators._upgradeContent);
      _.agHelper.AssertElementExist(
        _.inviteModal.locators._shareSettingsButton,
      );
      _.agHelper.AssertElementExist(_.inviteModal.locators._upgradeButton);
      cy.get(_.inviteModal.locators._upgradeButton).should(
        "have.attr",
        "href",
        "https://customer.appsmith.com/plans",
      );
      _.inviteModal.enablePublicAccessViaShareSettings("true");
    }
  });

  it("3. Change embedding restriction link on Share modal should redirect to Admin settings general page", () => {
    _.inviteModal.OpenShareModal();
    if (CURRENT_REPO === REPO.EE) {
      _.inviteModal.enablePublicAccessViaInviteTab("true");
    }
    _.inviteModal.SelectEmbedTab();
    cy.get(_.inviteModal.locators._restrictionChange).should(
      "have.attr",
      "href",
      "/settings",
    );
    _.inviteModal.CloseModal();
  });

  it("4. Change embedding restriction link on App settings should redirect to Admin settings general page", () => {
    _.embedSettings.OpenEmbedSettings();
    cy.get(_.inviteModal.locators._restrictionChange).should(
      "have.attr",
      "href",
      "/settings",
    );
    _.appSettings.ClosePane();
  });

  it("5. Check embed preview show/hides navigation bar according to setting", () => {
    _.inviteModal.ValidatePreviewEmbed("true");
    _.inviteModal.ValidatePreviewEmbed("false");
  });

  it("6. Check Show/Hides Navigation bar syncs between AppSettings Pane Embed tab & Share modal", () => {
    ValidateSyncWithInviteModal("true");
    ValidateSyncWithInviteModal("false");
  });
});
