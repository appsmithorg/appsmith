import { organizationConfigConnection } from "ee/constants/organizationConstants";
import type {
  AdminConfigType,
  Category,
} from "ee/pages/AdminSettings/config/types";
import {
  ADMIN_SETTINGS_CATEGORY_DEFAULT_PATH,
  ADMIN_SETTINGS_CATEGORY_PROFILE_PATH,
} from "constants/routes";
import type { User } from "constants/userConstants";
import set from "lodash/set";

/* settings is the updated & unsaved settings on Admin settings page */
export const saveAllowed = (
  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  settings: any,
  isFormLoginEnabled: boolean,
  socialLoginList: string[],
) => {
  const connectedMethodsCount =
    socialLoginList.length + (isFormLoginEnabled ? 1 : 0);

  if (connectedMethodsCount === 1) {
    const checkFormLogin =
        settings["isFormLoginEnabled"] !== false && isFormLoginEnabled,
      checkGoogleAuth =
        settings["APPSMITH_OAUTH2_GOOGLE_CLIENT_ID"] !== "" &&
        settings["isGoogleOAuthEnabled"] !== false &&
        socialLoginList.includes("google"),
      checkGithubAuth =
        settings["APPSMITH_OAUTH2_GITHUB_CLIENT_ID"] !== "" &&
        socialLoginList.includes("github");

    return checkFormLogin || checkGoogleAuth || checkGithubAuth;
  } else {
    return connectedMethodsCount >= 2;
  }
};

/* get default admin settings path */
export const getDefaultAdminSettingsPath = ({
  isSuperUser = false,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  organizationPermissions = [],
}: {
  isSuperUser: boolean;
  organizationPermissions: string[];
}): string => {
  if (isSuperUser) {
    return ADMIN_SETTINGS_CATEGORY_DEFAULT_PATH;
  }

  return ADMIN_SETTINGS_CATEGORY_PROFILE_PATH;
};

export const showAdminSettings = (user?: User): boolean => {
  return (user?.isSuperUser && user?.isConfigurable) || false;
};

export const getLoginUrl = (method: string): string => {
  const urls: Record<string, string> = {};

  return urls[method];
};

const MCP_CONFIG_FORM_PREFIX = "mcpConfig.";

export const isOrganizationConfig = (name: string): boolean => {
  const fields: string[] = organizationConfigConnection;

  return fields.includes(name) || name.startsWith(MCP_CONFIG_FORM_PREFIX);
};

export const flattenOrganizationConfigForSettingsForm = (
  organizationConfiguration?: Record<string, unknown> | null,
): Record<string, unknown> => {
  const configs: Record<string, unknown> = {};

  if (!organizationConfiguration) {
    return configs;
  }

  organizationConfigConnection.forEach((key: string) => {
    if (key === "mcpConfig") {
      const mcpConfig = organizationConfiguration.mcpConfig;

      if (mcpConfig && typeof mcpConfig === "object") {
        const mcp = mcpConfig as Record<string, unknown>;
        const enabled = mcp.enabled === true;
        const dataEnabled = mcp.dataEnabled === true;

        // Nested paths first: redux-form Field names like "mcpConfig.enabled" use lodash path get.
        // Dotted keys second: settingsMap / settingsConfig[id] lookups. lodash.set skips nesting
        // when the dotted own-property already exists.
        set(configs, "mcpConfig.enabled", enabled);
        set(configs, "mcpConfig.dataEnabled", dataEnabled);
        configs["mcpConfig.enabled"] = enabled;
        configs["mcpConfig.dataEnabled"] = dataEnabled;

        if (typeof mcp.serverUrl === "string") {
          set(configs, "mcpConfig.serverUrl", mcp.serverUrl);
          configs["mcpConfig.serverUrl"] = mcp.serverUrl;
        }
      }

      return;
    }

    if (Object.prototype.hasOwnProperty.call(organizationConfiguration, key)) {
      configs[key] = organizationConfiguration[key];
    }
  });

  return configs;
};

export const nestOrganizationConfigFromSettingsForm = (
  settings: Record<string, unknown>,
): Record<string, unknown> => {
  const config: Record<string, unknown> = {};
  const mcpConfig: Record<string, unknown> = {};
  let hasMcpConfig = false;

  for (const each in settings) {
    if (each.startsWith(MCP_CONFIG_FORM_PREFIX)) {
      hasMcpConfig = true;
      mcpConfig[each.slice(MCP_CONFIG_FORM_PREFIX.length)] = settings[each];
    } else if (organizationConfigConnection.includes(each)) {
      config[each] = settings[each];
    }
  }

  if (hasMcpConfig) {
    config.mcpConfig = mcpConfig;
  }

  return config;
};

export const getWrapperCategory = (
  categories: Record<string, AdminConfigType>,
  subCategory: string,
  category: string,
) => {
  return categories[subCategory || category];
};

export const getFilteredOrgCategories = (
  categories: Category[],
  isAuditLogsEnabled: boolean,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  isSuperUser?: boolean,
) => {
  return categories
    ?.map((category: Category) => {
      if (isSuperUser) {
        return category;
      }

      return null;
    })
    .filter(Boolean) as Category[];
};

export const getFilteredUserManagementCategories = (
  categories: Category[],
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  showAdminSettings: boolean,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  isSuperUser?: boolean,
) => {
  return categories
    ?.map((category: Category) => {
      if (isSuperUser) {
        return category;
      }

      return null;
    })
    .filter(Boolean) as Category[];
};

export const getFilteredInstanceCategories = (
  categories: Category[],
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  isSuperUser?: boolean,
) => {
  return categories
    ?.map((category: Category) => {
      if (isSuperUser) {
        return category;
      }

      return null;
    })
    .filter(Boolean) as Category[];
};
