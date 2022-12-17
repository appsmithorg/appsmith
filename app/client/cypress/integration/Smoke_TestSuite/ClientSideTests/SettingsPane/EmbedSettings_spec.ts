import * as _ from "../../../../support/Objects/ObjectsCore";

describe("In-app embed settings", () => {
  it("1. Updating size values should update the snippet", () => {
    _.appSettings.OpenAppSettings();
    _.appSettings.GoToEmbedSettings();
    _.embedSettings.updateDimension("H", "1000px");
    _.embedSettings.updateDimension("W", "900px");
    _.embedSettings.validateSnippet("900px", "1000px");
    _.appSettings.ClosePane();
  });
});
