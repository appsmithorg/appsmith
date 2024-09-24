import { CURRENT_REPO, REPO } from "../../../../fixtures/REPO";
import {
  embedSettings,
  inviteModal,
  agHelper,
  appSettings,
} from "../../../../support/Objects/ObjectsCore";
import { featureFlagIntercept } from "../../../../support/Objects/FeatureFlags";

describe("In-app embed settings", { tags: ["@tag.Settings"] }, () => {
  function ValidateSyncWithInviteModal(showNavigationBar: "On" | "Off") {
    embedSettings.OpenEmbedSettings();
    embedSettings.ToggleShowNavigationBar(showNavigationBar);
    inviteModal.OpenShareModal();
    inviteModal.SelectEmbedTab();
    const assertion =
      showNavigationBar === "On" ? "be.checked" : "not.be.checked";
    agHelper
      .GetElement(embedSettings.locators._showNavigationBar)
      .should(assertion);
    inviteModal.CloseModal();
  }

  it("1. Embed settings on App settings should show upgrade content if application is not public", () => {
    if (CURRENT_REPO === REPO.CE) {
      embedSettings.OpenEmbedSettings();
      agHelper.AssertElementExist(inviteModal.locators._upgradeContent);
      agHelper.AssertElementAbsence(inviteModal.locators._shareSettingsButton);
      appSettings.ClosePane();
    }
  });

  it("2. Embed settings on Share modal should show upgrade content if application is not public", () => {
    if (CURRENT_REPO === REPO.CE) {
      inviteModal.OpenShareModal();
      inviteModal.SelectEmbedTab();
      agHelper.AssertElementExist(inviteModal.locators._upgradeContent);
      agHelper.AssertElementExist(inviteModal.locators._shareSettingsButton);
      inviteModal.enablePublicAccessViaShareSettings("true");
    }
  });

  it("3. Change embedding restriction link on Share modal should redirect to Admin settings general page", () => {
    inviteModal.OpenShareModal();
    if (CURRENT_REPO === REPO.EE) {
      inviteModal.enablePublicAccessViaInviteTab("true");
    }
    inviteModal.SelectEmbedTab();
    cy.get(inviteModal.locators._restrictionChange).should(
      "have.attr",
      "href",
      "/settings",
    );
    inviteModal.CloseModal();
  });

  it("4. Change embedding restriction link on App settings should redirect to Admin settings general page", () => {
    embedSettings.OpenEmbedSettings();
    cy.get(inviteModal.locators._restrictionChange).should(
      "have.attr",
      "href",
      "/settings",
    );
    appSettings.ClosePane();

    //Check embed preview show/hides navigation bar according to setting
    inviteModal.ValidatePreviewEmbed("On");
    inviteModal.ValidatePreviewEmbed("Off");

    //Check Show/Hides Navigation bar syncs between AppSettings Pane Embed tab & Share modal
    ValidateSyncWithInviteModal("On");
    ValidateSyncWithInviteModal("Off");
  });

  it("5. [Feature flag release_embed_hide_share_settings_enabled=false] Changing the show navigation bar setting in the App settings pane should update the embed URL with embed parameter", () => {
    featureFlagIntercept(
      {
        release_embed_hide_share_settings_enabled: false,
      },
      false,
    );
    agHelper.RefreshPage();
    embedSettings.OpenEmbedSettings();
    embedSettings.TogglePublicAccess(true);
    embedSettings.ToggleShowNavigationBar("On");
    agHelper.GetNAssertElementText(
      embedSettings.locators._snippet,
      "embed=true",
      "not.contain.text",
    );
    embedSettings.ToggleShowNavigationBar("Off");
    agHelper.GetNAssertElementText(
      embedSettings.locators._snippet,
      "embed=true",
      "contain.text",
    );
  });

  it("6. [Feature flag release_embed_hide_share_settings_enabled=true] Changing the show navigation bar setting in the App settings pane should update the embed URL with navbar parameter", () => {
    featureFlagIntercept(
      { release_embed_hide_share_settings_enabled: true },
      false,
    );
    agHelper.RefreshPage();

    embedSettings.OpenEmbedSettings();
    embedSettings.TogglePublicAccess(true);
    embedSettings.ToggleShowNavigationBar("On");
    agHelper.GetNAssertElementText(
      embedSettings.locators._snippet,
      "navbar=true",
      "contain.text",
    );
    embedSettings.ToggleShowNavigationBar("Off");
    agHelper.GetNAssertElementText(
      embedSettings.locators._snippet,
      "navbar=true",
      "not.contain.text",
    );
  });
});
