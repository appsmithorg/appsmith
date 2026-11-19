import { NAVIGATION_SETTINGS } from "constants/AppConstants";
import {
  getLogoConfigurationSwitches,
  getNextLogoConfiguration,
} from "./utils";

const { LOGO_CONFIGURATION } = NAVIGATION_SETTINGS;

describe("getLogoConfigurationSwitches", () => {
  it.each([
    [
      LOGO_CONFIGURATION.LOGO_AND_APPLICATION_TITLE,
      { logo: true, applicationTitle: true },
    ],
    [LOGO_CONFIGURATION.LOGO_ONLY, { logo: true, applicationTitle: false }],
    [
      LOGO_CONFIGURATION.APPLICATION_TITLE_ONLY,
      { logo: false, applicationTitle: true },
    ],
    [
      LOGO_CONFIGURATION.NO_LOGO_OR_APPLICATION_TITLE,
      { logo: false, applicationTitle: false },
    ],
  ] as const)(
    "maps %s to the expected switches",
    (logoConfiguration, expected) => {
      expect(getLogoConfigurationSwitches(logoConfiguration)).toEqual(expected);
    },
  );

  it("defaults both switches off for unknown or missing values", () => {
    expect(getLogoConfigurationSwitches(undefined)).toEqual({
      logo: false,
      applicationTitle: false,
    });
  });
});

describe("getNextLogoConfiguration", () => {
  it("turns application title off from logoAndApplicationTitle", () => {
    expect(
      getNextLogoConfiguration(
        LOGO_CONFIGURATION.LOGO_AND_APPLICATION_TITLE,
        "applicationTitle",
      ),
    ).toBe(LOGO_CONFIGURATION.LOGO_ONLY);
  });

  it("turns logo off from logoAndApplicationTitle", () => {
    expect(
      getNextLogoConfiguration(
        LOGO_CONFIGURATION.LOGO_AND_APPLICATION_TITLE,
        "logo",
      ),
    ).toBe(LOGO_CONFIGURATION.APPLICATION_TITLE_ONLY);
  });

  it("turns application title on from logoOnly", () => {
    expect(
      getNextLogoConfiguration(
        LOGO_CONFIGURATION.LOGO_ONLY,
        "applicationTitle",
      ),
    ).toBe(LOGO_CONFIGURATION.LOGO_AND_APPLICATION_TITLE);
  });

  it("turns logo on from applicationTitleOnly", () => {
    expect(
      getNextLogoConfiguration(
        LOGO_CONFIGURATION.APPLICATION_TITLE_ONLY,
        "logo",
      ),
    ).toBe(LOGO_CONFIGURATION.LOGO_AND_APPLICATION_TITLE);
  });

  it("turns both off from applicationTitleOnly by clearing the title", () => {
    expect(
      getNextLogoConfiguration(
        LOGO_CONFIGURATION.APPLICATION_TITLE_ONLY,
        "applicationTitle",
      ),
    ).toBe(LOGO_CONFIGURATION.NO_LOGO_OR_APPLICATION_TITLE);
  });

  it("turns both on from noLogoOrApplicationTitle by enabling the title", () => {
    expect(
      getNextLogoConfiguration(
        LOGO_CONFIGURATION.NO_LOGO_OR_APPLICATION_TITLE,
        "applicationTitle",
      ),
    ).toBe(LOGO_CONFIGURATION.APPLICATION_TITLE_ONLY);
  });
});
