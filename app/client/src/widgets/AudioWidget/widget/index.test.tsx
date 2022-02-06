import { PropertyPaneControlConfig } from "constants/PropertyControlConstants";
import AudioWidget from ".";

const urlTests = [
  { url: "https://appsmith.com/", isValid: true },
  { url: "http://appsmith.com/", isValid: true },
  { url: "appsmith.com/", isValid: true },
  { url: "appsmith.com", isValid: true },
  { url: "release.appsmith.com", isValid: true },
  { url: "appsmith.com/audio.mp3", isValid: true },
  { url: "appsmith./audio.mp3", isValid: false },
  { url: "https://appsmith.com/randompath/somefile.mp3", isValid: true },
  { url: "https://appsmith.com/randompath/some file.mp3", isValid: true },
  { url: "random string", isValid: false },
  {
    url: "blob:https://dev.appsmith.com/9db94f56-5e32-4b18-2758-64c21a7f4610",
    isValid: true,
  },
];

describe("urlRegexValidation", () => {
  const generalSectionProperties: PropertyPaneControlConfig[] = AudioWidget.getPropertyPaneConfig().filter(
    (x) => x.sectionName === "General",
  )[0].children;
  const urlPropertyControl = generalSectionProperties.filter(
    (x) => x.propertyName === "url",
  )[0];
  const regEx = urlPropertyControl.validation?.params?.regex;

  it("validate existence of regEx", () => {
    expect(regEx).toBeDefined();
  });

  it("test regEx", () => {
    urlTests.forEach((test) => {
      if (test.isValid) expect(test.url).toMatch(regEx || "");
      else expect(test.url).not.toMatch(regEx || "");
    });
  });
});
