import store from "store";

export class ThemeProvider {
  static widgetThemeDependencyMap: Map<string, any> = new Map();
  static registerThemeDepencyMap(type: string, configs: any[]) {
    const filteredConfigs: any[] = [];
    configs.forEach((config) =>
      Array.prototype.push.apply(filteredConfigs, config.children),
    );

    if (filteredConfigs.length) {
      const themeDependencyConfig = filteredConfigs.filter(
        (d: any) => !!d.themePropertyMap,
      );
      const themeDependencies: any = {};

      themeDependencyConfig.forEach((config: any) => {
        themeDependencies[config.propertyName] = config.themePropertyMap;
      });

      this.widgetThemeDependencyMap.set(type, themeDependencies);
    }
  }

  static injectProperties(
    widgetType: string,
    widgetData: any,
    theme: any = {},
  ) {
    const dependencies = this.widgetThemeDependencyMap.get(widgetType);
    if (dependencies) {
      const injectedValues: any = {};
      Object.keys(dependencies).forEach((key) => {
        if (!widgetData[key]) {
          injectedValues[key] = theme[dependencies[key]];
        }
      });

      return {
        ...widgetData,
        ...injectedValues,
      };
    } else {
      return widgetData;
    }
  }
}
