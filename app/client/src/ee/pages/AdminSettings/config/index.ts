export * from "ce/pages/AdminSettings/config";
import { ConfigFactory } from "pages/Settings/config/ConfigFactory";
import { config as GroupsListing } from "@appsmith/pages/AdminSettings/config/groupsListing";
import { config as RolesListing } from "@appsmith/pages/AdminSettings/config/rolesListing";
import { config as BillingConfig } from "@appsmith/pages/AdminSettings/config/billingConfig";
import { isGACEnabled } from "@appsmith/utils/planHelpers";
import { selectFeatureFlags } from "@appsmith/selectors/featureFlagsSelectors";
import store from "store";

const featureFlags = selectFeatureFlags(store.getState());

const isGACFFEnabled = isGACEnabled(featureFlags);

if (isGACFFEnabled) ConfigFactory.register(GroupsListing);
if (isGACFFEnabled) ConfigFactory.register(RolesListing);
ConfigFactory.register(BillingConfig);

export default ConfigFactory;
