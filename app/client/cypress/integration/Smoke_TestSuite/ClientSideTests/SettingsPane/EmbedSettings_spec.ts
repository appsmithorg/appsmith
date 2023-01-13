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

  it("1. Updating Embed size values from AppSettings should update the snippet", () => {
    _.embedSettings.OpenEmbedSettings();
    _.embedSettings.UpdateDimension("H", "1000px");
    _.embedSettings.UpdateDimension("W", "900px");
    _.embedSettings.ValidateSnippet("900px", "1000px");
    _.appSettings.ClosePane();
  });

  it("2. Updating Embed size values from ShareModal should update the snippet", () => {
    _.inviteModal.OpenShareModal();
    _.inviteModal.SelectEmbedTab();
    _.embedSettings.UpdateDimension("H", "720px");
    _.embedSettings.UpdateDimension("W", "1024px");
    _.embedSettings.ValidateSnippet("1024px", "720px");
    _.inviteModal.CloseModal();
  });

  it("3. Check embed preview show/hides navigation bar according to setting", () => {
    _.inviteModal.ValidatePreviewEmbed("true");
    _.inviteModal.ValidatePreviewEmbed("false");
  });

  it("4. Check Show/Hides Navigation bar syncs between AppSettings Pane Embed tab & Share modal", () => {
    ValidateSyncWithInviteModal("true");
    ValidateSyncWithInviteModal("false");
  });
});
