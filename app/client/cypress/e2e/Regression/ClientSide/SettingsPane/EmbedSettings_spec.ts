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
      _.agHelper.GetNAssertContains(
        _.inviteModal.locators._upgradeContent,
        "Appsmith Business Edition",
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

      _.agHelper.GetNAssertContains(
        _.inviteModal.locators._upgradeContent,
        "Appsmith Business Edition",
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

    //Check embed preview show/hides navigation bar according to setting
    _.inviteModal.ValidatePreviewEmbed("true");
    _.inviteModal.ValidatePreviewEmbed("false");

    //Check Show/Hides Navigation bar syncs between AppSettings Pane Embed tab & Share modal
    ValidateSyncWithInviteModal("true");
    ValidateSyncWithInviteModal("false");
  });

  it("5. [Feature flag APP_EMBED_VIEW_HIDE_SHARE_SETTINGS_VISIBILITY=false] Changing the show navigation bar setting in the App settings pane should update the embed URL", () => {
    cy.intercept("GET", "/api/v1/users/features", {
      fixture: "featureFlags.json",
    }).as("featureFlags");
    _.agHelper.RefreshPage();
    _.embedSettings.OpenEmbedSettings();
    _.embedSettings.TogglePublicAccess(true);
    _.embedSettings.ToggleShowNavigationBar("true");
    _.agHelper.GetNAssertElementText(
      _.embedSettings.locators._snippet,
      "embed=true",
      "not.contain.text",
    );
    _.embedSettings.ToggleShowNavigationBar("false");
    _.agHelper.GetNAssertElementText(
      _.embedSettings.locators._snippet,
      "embed=true",
      "contain.text",
    );
  });

  it("6. [Feature flag APP_EMBED_VIEW_HIDE_SHARE_SETTINGS_VISIBILITY=true] Changing the show navigation bar setting in the App settings pane should update the embed URL", () => {
    cy.intercept("GET", "/api/v1/users/features", {
      fixture: "featureFlagsComplement.json",
    }).as("featureFlags");
    _.agHelper.RefreshPage();

    _.embedSettings.OpenEmbedSettings();
    _.embedSettings.TogglePublicAccess(true);
    _.embedSettings.ToggleShowNavigationBar("true");
    _.agHelper.GetNAssertElementText(
      _.embedSettings.locators._snippet,
      "navbar=true",
      "contain.text",
    );
    _.embedSettings.ToggleShowNavigationBar("false");
    _.agHelper.GetNAssertElementText(
      _.embedSettings.locators._snippet,
      "navbar=true",
      "not.contain.text",
    );
  });
});
