import * as _ from "../../../../support/Objects/ObjectsCore";

describe("In-app embed settings", () => {
  it("1. Updating size values should update the snippet", () => {
    _.embedSettings.OpenEmbedSettings();
    _.embedSettings.UpdateDimension("H", "1000px");
    _.embedSettings.UpdateDimension("W", "900px");
    _.embedSettings.ValidateSnippet("900px", "1000px");
    _.appSettings.ClosePane();
  });

  it("2. Updating size values should update the snippet in the embed tab", () => {
    _.inviteModal.OpenShareModal();
    _.inviteModal.SelectEmbedTab();
    _.embedSettings.UpdateDimension("H", "1000px");
    _.embedSettings.UpdateDimension("W", "900px");
    _.embedSettings.ValidateSnippet("900px", "1000px");
    _.inviteModal.CloseModal();
  });

  it("3. Check embed preview show/hides navigation bar according to setting", () => {
    _.inviteModal.OpenShareModal();
    _.inviteModal.SelectEmbedTab();
    _.inviteModal.ValidatePreviewEmbed();
  });
});
