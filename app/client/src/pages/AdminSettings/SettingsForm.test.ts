import { objectKeys } from "@appsmith/utils";
import { ConfigFactory } from "pages/AdminSettings/config/ConfigFactory";
import { config as InstanceSettings } from "ee/pages/AdminSettings/config/instanceSettings";
import { SettingCategories } from "ee/pages/AdminSettings/config/types";
import { validate } from "./SettingsForm";

const onPage = (category: string, selected?: string) => ({
  match: { params: { category, selected } },
});

/**
 * When the form loads, SettingsForm marks every field that `validate` reports as touched. This makes a stored value
 * that fails a newer check show its error at once, instead of silently disabling Save.
 */
describe("SettingsForm validate", () => {
  // The app registers instance settings only for a super user. The test store has no user, so register them here.
  beforeAll(() => ConfigFactory.register(InstanceSettings));

  it("reports a stored custom domain that has a protocol on the instance settings page", () => {
    expect(
      objectKeys(
        validate(
          { APPSMITH_CUSTOM_DOMAIN: "https://x.com" },
          onPage(SettingCategories.INSTANCE_SETTINGS),
        ),
      ),
    ).toEqual(["APPSMITH_CUSTOM_DOMAIN"]);
  });

  it("ignores the custom domain on another page, where the field is not shown", () => {
    expect(
      validate(
        { APPSMITH_CUSTOM_DOMAIN: "https://x.com" },
        onPage(SettingCategories.AUTHENTICATION),
      ),
    ).toEqual({});
  });

  it("uses the sub-page when there is one", () => {
    expect(
      validate(
        { APPSMITH_CUSTOM_DOMAIN: "https://x.com" },
        onPage("some-parent", SettingCategories.INSTANCE_SETTINGS),
      ),
    ).toHaveProperty("APPSMITH_CUSTOM_DOMAIN");
  });

  it("reports nothing for valid stored values", () => {
    expect(
      validate(
        { APPSMITH_CUSTOM_DOMAIN: "apps.example.com", instanceName: "" },
        onPage(SettingCategories.INSTANCE_SETTINGS),
      ),
    ).toEqual({});
  });
});
