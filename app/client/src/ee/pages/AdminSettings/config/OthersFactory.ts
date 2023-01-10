import {
  AdminConfigType,
  Category,
  SettingTypes,
} from "@appsmith/pages/AdminSettings/config/types";

export class OthersFactory {
  static categories: Category[] = [];
  static wrapperCategories: Record<string, AdminConfigType> = {};
  static savableCategories: string[] = [];

  static getCategory(config: AdminConfigType): Category {
    if (config.controlType === SettingTypes.PAGE) {
      OthersFactory.wrapperCategories[config.type] = config;
    }
    if (config.canSave) {
      OthersFactory.savableCategories.push(config.type);
    }

    return {
      icon: config.icon,
      title: config.title,
      slug: config.type,
      subText: config.subText,
      children: config?.children?.map((child) =>
        OthersFactory.getCategory(child),
      ),
    };
  }

  static registerCategory(config: AdminConfigType): void {
    OthersFactory.categories.push(OthersFactory.getCategory(config));
  }

  static register(config: AdminConfigType) {
    OthersFactory.registerCategory(config);
  }

  static getCategoryDetails(
    currentCategory: string,
    currentSubCategory: string,
  ) {
    if (
      currentSubCategory &&
      OthersFactory.wrapperCategories[currentCategory].children
    ) {
      return OthersFactory.wrapperCategories[currentCategory].children?.find(
        (category) => category.type === currentSubCategory,
      );
    } else {
      return OthersFactory.categories.find(
        (category) => category.slug === currentCategory,
      );
    }
  }
}
