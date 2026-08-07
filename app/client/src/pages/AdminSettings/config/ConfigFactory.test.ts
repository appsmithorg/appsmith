import type { AdminConfigType } from "ee/pages/AdminSettings/config/types";
import {
  CategoryType,
  SettingCategories,
  SettingTypes,
} from "ee/pages/AdminSettings/config/types";
import { ConfigFactory } from "./ConfigFactory";

/**
 * Registration has to be idempotent because the same category is legitimately registered from more than one place:
 * a CE-owned feature registers itself in `ce/pages/AdminSettings/config`, and an edition that also registers it in
 * its own `ee/` index calls `register` twice for one category. That happens through a clean merge, with no conflict
 * to surface it, so the duplicate is invisible until someone opens admin settings and sees the entry twice.
 */
describe("ConfigFactory registration is idempotent", () => {
  const buildConfig = (canSave: boolean): AdminConfigType =>
    ({
      type: SettingCategories.AI,
      categoryType: CategoryType.ORGANIZATION,
      controlType: SettingTypes.PAGE,
      canSave,
      title: "AI Assistant",
      icon: "sparkling-filled",
      settings: [
        {
          id: "TEST_AI_SETTING",
          category: SettingCategories.AI,
          controlType: SettingTypes.TEXTINPUT,
          label: "Test setting",
        },
      ],
    }) as unknown as AdminConfigType;

  beforeEach(() => {
    ConfigFactory.categories = [];
    ConfigFactory.settings = [];
    ConfigFactory.settingsMap = {};
    ConfigFactory.savableCategories = [];
    ConfigFactory.wrapperCategories = {};
  });

  it("registers a category once no matter how many times it is registered", () => {
    ConfigFactory.register(buildConfig(false));
    ConfigFactory.register(buildConfig(false));
    ConfigFactory.register(buildConfig(false));

    const matching = ConfigFactory.categories.filter(
      (category) => category.slug === SettingCategories.AI,
    );

    expect(matching).toHaveLength(1);
  });

  it("does not duplicate the settings a repeated registration carries", () => {
    ConfigFactory.register(buildConfig(false));
    ConfigFactory.register(buildConfig(false));

    const matching = ConfigFactory.settings.filter(
      (setting) => setting.id === "TEST_AI_SETTING",
    );

    // settingsMap is keyed so it was always safe; the settings ARRAY is appended to and was not.
    expect(matching).toHaveLength(1);
  });

  it("does not duplicate a savable category", () => {
    ConfigFactory.register(buildConfig(true));
    ConfigFactory.register(buildConfig(true));

    const matching = ConfigFactory.savableCategories.filter(
      (type) => type === SettingCategories.AI,
    );

    expect(matching).toHaveLength(1);
  });

  it("still registers genuinely distinct categories", () => {
    ConfigFactory.register(buildConfig(false));
    ConfigFactory.register({
      ...buildConfig(false),
      type: SettingCategories.GENERAL,
    } as AdminConfigType);

    expect(ConfigFactory.categories).toHaveLength(2);
  });
});
