const PACKAGE_KEY = "__APPSMITH_PACKAGES__";
const MODULE_CONFIG_KEY = "__APPSMITH_PACKAGE_CONFIG__";

export const getPackageIds = (): string[] => {
  return JSON.parse(localStorage.getItem(PACKAGE_KEY) || "[]");
};

export const isPackage = (appId: string) => {
  const packages = getPackageIds();

  return packages.includes(appId);
};

export const setModuleConfig = (
  moduleId: string,
  updatedConfig: Record<string, unknown>,
) => {
  const config = JSON.parse(localStorage.getItem(MODULE_CONFIG_KEY) || "{}");

  config[moduleId] = {
    ...config[moduleId],
    ...updatedConfig,
  };

  localStorage.setItem(MODULE_CONFIG_KEY, JSON.stringify(config));
};

export const getModulesConfig = () => {
  return JSON.parse(localStorage.getItem(MODULE_CONFIG_KEY) || "{}");
};

export const getModuleConfig = (moduleId: string) => {
  const config = JSON.parse(localStorage.getItem(MODULE_CONFIG_KEY) || "{}");

  return config[moduleId] || {};
};

export const moduleHasUI = (moduleId: string) => {
  const moduleConfig = getModuleConfig(moduleId);

  return moduleConfig.hasUI as boolean | undefined;
};
