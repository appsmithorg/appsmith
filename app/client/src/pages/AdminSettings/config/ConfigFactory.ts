import type {
  AdminConfigType,
  Category,
  Setting,
} from "ee/pages/AdminSettings/config/types";
import { SettingTypes } from "ee/pages/AdminSettings/config/types";
export class ConfigFactory {
  static settingsMap: Record<string, Setting> = {};
  static settings: Setting[] = [];
  static categories: Category[] = [];
  static wrapperCategories: Record<string, AdminConfigType> = {};
  static savableCategories: string[] = [];

  static registerSettings(config: AdminConfigType): void {
    config?.settings?.forEach((item) => {
      ConfigFactory.settingsMap[item.id] = {
        ...item,
      };
      ConfigFactory.settings.push({
        name: item.id,
        ...item,
      });

      item?.advanced?.forEach((subItem) => {
        ConfigFactory.settingsMap[subItem.id] = {
          ...subItem,
        };
      });
    });
    config?.children?.forEach((child) => ConfigFactory.registerSettings(child));
  }

  static getCategory(config: AdminConfigType): Category {
    if (config.controlType === SettingTypes.PAGE) {
      ConfigFactory.wrapperCategories[config.type] = config;
    }

    if (config.canSave) {
      ConfigFactory.savableCategories.push(config.type);
    }

    return {
      icon: config.icon,
      title: config.title,
      slug: config.type,
      subText: config.subText,
      categoryType: config.categoryType,
      isEnterprise: config.isEnterprise,
      needsRefresh: config.needsRefresh,
      isFeatureEnabled: config.isFeatureEnabled,
      children: config?.children?.map((child) =>
        ConfigFactory.getCategory(child),
      ),
    };
  }

  static registerCategory(config: AdminConfigType): void {
    ConfigFactory.categories.push(ConfigFactory.getCategory(config));
  }

  /**
   * Registers an admin settings category, once.
   *
   * <p>Registration is idempotent because the same category can legitimately be registered from more than one
   * place. A CE-owned feature registers itself in `ce/pages/AdminSettings/config`, and an edition that also
   * registers it in its own `ee/` index ends up calling this twice for one category — which nothing here used to
   * notice. All three collections below accumulate on a raw second call: `categories` (a duplicated entry in the
   * admin sidebar), `settings` (a duplicated row), and `savableCategories` (a duplicated save target). Only
   * `settingsMap` was safe, because it is keyed rather than appended.
   *
   * <p>Guarding at this single entry point rather than inside each collection keeps the three consistent — a
   * category is either fully registered or not at all — and means a duplicate registration is harmless instead of
   * being something each caller has to remember to avoid.
   */
  static register(config: AdminConfigType) {
    if (ConfigFactory.isRegistered(config)) {
      return;
    }

    ConfigFactory.registerSettings(config);
    ConfigFactory.registerCategory(config);
  }

  /** True when a category with this slug has already been registered. */
  static isRegistered(config: AdminConfigType): boolean {
    return ConfigFactory.categories.some(
      (category) => category.slug === config.type,
    );
  }

  static validate(name: string, value: string) {
    const setting = ConfigFactory.settingsMap[name];

    if (setting?.validate) {
      return setting.validate(value, setting);
    }

    return "";
  }

  static get(category: string) {
    ConfigFactory.settings.forEach((setting) => {
      setting.isHidden = setting.category !== category;
    });

    return ConfigFactory.settings;
  }

  static getCategoryDetails(
    currentCategory: string,
    currentSubCategory: string,
  ) {
    if (
      currentSubCategory &&
      ConfigFactory.wrapperCategories[currentCategory].children
    ) {
      return ConfigFactory.wrapperCategories[currentCategory].children?.find(
        (category) => category.type === currentSubCategory,
      );
    } else {
      return ConfigFactory.categories.find(
        (category) => category.slug === currentCategory,
      );
    }
  }
}
