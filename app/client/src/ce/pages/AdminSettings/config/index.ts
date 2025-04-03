import { ConfigFactory } from "pages/AdminSettings/config/ConfigFactory";

import { config as GeneralConfig } from "ee/pages/AdminSettings/config/general";
import { config as EmailConfig } from "pages/AdminSettings/config/email";
import { config as DeveloperSettings } from "ee/pages/AdminSettings/config/DeveloperSettings";
import { config as VersionConfig } from "pages/AdminSettings/config/version";
import { config as AdvancedConfig } from "pages/AdminSettings/config/advanced";
import { config as Authentication } from "ee/pages/AdminSettings/config/authentication";
import { config as BrandingConfig } from "ee/pages/AdminSettings/config/branding";
import { config as ProvisioningConfig } from "ee/pages/AdminSettings/config/provisioning";
import { config as UserListing } from "ee/pages/AdminSettings/config//userlisting";
import { config as AuditLogsConfig } from "ee/pages/AdminSettings/config/auditlogs";

import { selectFeatureFlags } from "ee/selectors/featureFlagsSelectors";
import store from "store";

const featureFlags = selectFeatureFlags(store.getState());

const isMultiOrgEnabled = featureFlags?.license_multi_org_enabled;

ConfigFactory.register(GeneralConfig);

if (!isMultiOrgEnabled) ConfigFactory.register(EmailConfig);

if (!isMultiOrgEnabled) ConfigFactory.register(DeveloperSettings);

ConfigFactory.register(Authentication);

if (!isMultiOrgEnabled) ConfigFactory.register(AdvancedConfig);

ConfigFactory.register(VersionConfig);
ConfigFactory.register(BrandingConfig);
ConfigFactory.register(ProvisioningConfig);
ConfigFactory.register(UserListing);
ConfigFactory.register(AuditLogsConfig);

export default ConfigFactory;
