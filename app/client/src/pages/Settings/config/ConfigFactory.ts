import {
  AdminConfigType,
  Category,
  Setting,
  SettingTypes,
} from "@appsmith/pages/AdminSettings/config/types";
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
      title: config.title,
      slug: config.type,
      subText: config.subText,
      children: config?.children?.map((child) =>
        ConfigFactory.getCategory(child),
      ),
    };
  }

  static registerCategory(config: AdminConfigType): void {
    ConfigFactory.categories.push(ConfigFactory.getCategory(config));
  }

  static register(config: AdminConfigType) {
    ConfigFactory.registerSettings(config);
    ConfigFactory.registerCategory(config);
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
