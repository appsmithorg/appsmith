import { ConfigFactory } from "pages/AdminSettings/config/ConfigFactory";

import { config as ProfileConfig } from "pages/AdminSettings/config/profile";
import { config as GeneralConfig } from "ee/pages/AdminSettings/config/general";
import { config as EmailConfig } from "pages/AdminSettings/config/email";
import { config as InstanceSettings } from "ee/pages/AdminSettings/config/instanceSettings";
import { config as Configuration } from "ee/pages/AdminSettings/config/configuration";
import { config as VersionConfig } from "pages/AdminSettings/config/version";
import { config as UserSettings } from "ee/pages/AdminSettings/config/userSettings";
import { config as Authentication } from "ee/pages/AdminSettings/config/authentication";
import { config as BrandingConfig } from "ee/pages/AdminSettings/config/branding";
import { config as ProvisioningConfig } from "ee/pages/AdminSettings/config/provisioning";
import { config as UserListing } from "ee/pages/AdminSettings/config//userlisting";
import { config as AuditLogsConfig } from "ee/pages/AdminSettings/config/auditlogs";

import { selectFeatureFlags } from "ee/selectors/featureFlagsSelectors";
import store from "store";
import { isMultiOrgFFEnabled } from "ee/utils/planHelpers";
import { getCurrentUser } from "selectors/usersSelectors";
import { showAdminSettings } from "ee/utils/adminSettingsHelpers";

const featureFlags = selectFeatureFlags(store.getState());
const isMultiOrgEnabled = isMultiOrgFFEnabled(featureFlags);
const user = getCurrentUser(store.getState());
const isSuperUser = showAdminSettings(user);

// Profile categories
ConfigFactory.register(ProfileConfig);

// Organisation categories
if (isSuperUser) ConfigFactory.register(GeneralConfig);

if (isSuperUser && !isMultiOrgEnabled) ConfigFactory.register(EmailConfig);

if (isSuperUser) ConfigFactory.register(BrandingConfig);

if (isSuperUser) ConfigFactory.register(AuditLogsConfig);

// User management categories
if (isSuperUser) ConfigFactory.register(UserSettings);

if (isSuperUser) ConfigFactory.register(Authentication);

if (isSuperUser) ConfigFactory.register(ProvisioningConfig);

if (isSuperUser) ConfigFactory.register(UserListing);

// Instance categories
if (isSuperUser && !isMultiOrgEnabled) ConfigFactory.register(InstanceSettings);

if (isSuperUser && !isMultiOrgEnabled) ConfigFactory.register(Configuration);

if (isSuperUser && !isMultiOrgEnabled) ConfigFactory.register(VersionConfig);

export default ConfigFactory;
