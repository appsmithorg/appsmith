import {
  AdminConfigType,
  Category,
  SettingTypes,
} from "@appsmith/pages/AdminSettings/config/types";

export class AclFactory {
  static categories: Category[] = [];
  static wrapperCategories: Record<string, AdminConfigType> = {};
  static savableCategories: string[] = [];

  static getCategory(config: AdminConfigType): Category {
    if (config.controlType === SettingTypes.PAGE) {
      AclFactory.wrapperCategories[config.type] = config;
    }
    if (config.canSave) {
      AclFactory.savableCategories.push(config.type);
    }

    return {
      title: config.title,
      slug: config.type,
      subText: config.subText,
      children: config?.children?.map((child) => AclFactory.getCategory(child)),
    };
  }

  static registerCategory(config: AdminConfigType): void {
    AclFactory.categories.push(AclFactory.getCategory(config));
  }

  static register(config: AdminConfigType) {
    AclFactory.registerCategory(config);
  }

  static getCategoryDetails(
    currentCategory: string,
    currentSubCategory: string,
  ) {
    if (
      currentSubCategory &&
      AclFactory.wrapperCategories[currentCategory].children
    ) {
      return AclFactory.wrapperCategories[currentCategory].children?.find(
        (category) => category.type === currentSubCategory,
      );
    } else {
      return AclFactory.categories.find(
        (category) => category.slug === currentCategory,
      );
    }
  }
}
