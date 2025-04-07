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

const featureFlags = selectFeatureFlags(store.getState());
const isMultiOrgEnabled = isMultiOrgFFEnabled(featureFlags);

// Profile categories
ConfigFactory.register(ProfileConfig);

// Organisation categories
ConfigFactory.register(GeneralConfig);

if (!isMultiOrgEnabled) ConfigFactory.register(EmailConfig);

ConfigFactory.register(BrandingConfig);
ConfigFactory.register(AuditLogsConfig);

// User management categories
ConfigFactory.register(UserSettings);
ConfigFactory.register(Authentication);
ConfigFactory.register(ProvisioningConfig);
ConfigFactory.register(UserListing);

// Instance categories
if (!isMultiOrgEnabled) ConfigFactory.register(InstanceSettings);

if (!isMultiOrgEnabled) ConfigFactory.register(Configuration);

if (!isMultiOrgEnabled) ConfigFactory.register(VersionConfig);

export default ConfigFactory;
